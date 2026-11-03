from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..modeles import (
    Commande,
    LigneCommande,
    Produit,
    StatutCommande,
)
from ..schemas.commande import CommandeCreer, CommandeModifierAdmin

TRANSITIONS: dict[StatutCommande, set[StatutCommande]] = {
    StatutCommande.nouvelle: {
        StatutCommande.validee,
        StatutCommande.refusee,
        StatutCommande.annulee,
    },
    StatutCommande.validee: {StatutCommande.annulee},
    StatutCommande.refusee: set(),
    StatutCommande.annulee: set(),
}

_OPTIONS = (selectinload(Commande.lignes),)


def _prix_effectif(produit: Produit) -> int:
    if produit.promo_active and produit.prix_promo is not None:
        return produit.prix_promo
    return produit.prix


def creer(session: Session, donnees: CommandeCreer, client_id: int | None = None) -> Commande:
    # Fusion des quantités par produit
    quantites: dict[int, int] = {}
    for ligne in donnees.lignes:
        quantites[ligne.produit_id] = quantites.get(ligne.produit_id, 0) + ligne.quantite

    lignes_creees: list[LigneCommande] = []
    total = 0
    for produit_id, quantite in quantites.items():
        produit = session.get(Produit, produit_id)
        if produit is None or not produit.actif:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Produit {produit_id} indisponible")
        if produit.quantite_stock < quantite:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Stock insuffisant pour « {produit.nom} » (disponible : {produit.quantite_stock})",
            )
        prix = _prix_effectif(produit)
        sous_total = prix * quantite
        total += sous_total
        lignes_creees.append(
            LigneCommande(
                produit_id=produit.id,
                nom_produit=produit.nom,
                reference_produit=produit.reference,
                prix_unitaire=prix,
                quantite=quantite,
                sous_total=sous_total,
            )
        )

    commande = Commande(
        reference="",
        client_id=client_id,
        nom_client=donnees.nom_client.strip(),
        telephone_client=donnees.telephone_client.strip(),
        email_client=(donnees.email_client or None),
        mode_retrait=donnees.mode_retrait,
        adresse_livraison=(donnees.adresse_livraison or None),
        moyen_paiement=donnees.moyen_paiement,
        note_client=donnees.note_client,
        statut=StatutCommande.nouvelle,
        montant_total=total,
        lignes=lignes_creees,
    )
    session.add(commande)
    session.flush()
    commande.reference = f"CMD-{datetime.now(timezone.utc).year}-{commande.id:05d}"
    session.commit()
    return obtenir(session, commande.id)


def obtenir(session: Session, commande_id: int) -> Commande:
    commande = session.scalar(
        select(Commande).where(Commande.id == commande_id).options(*_OPTIONS)
    )
    if commande is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commande introuvable")
    return commande


def obtenir_par_reference(session: Session, reference: str) -> Commande:
    commande = session.scalar(
        select(Commande)
        .where(Commande.reference == reference.strip().upper())
        .options(*_OPTIONS)
    )
    if commande is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commande introuvable")
    return commande


def lister_pour_client(session: Session, client_id: int) -> list[Commande]:
    return list(
        session.scalars(
            select(Commande)
            .where(Commande.client_id == client_id)
            .order_by(Commande.cree_le.desc())
            .options(*_OPTIONS)
        ).all()
    )


def lister(
    session: Session,
    *,
    statut: StatutCommande | None = None,
    recherche: str | None = None,
    page: int = 1,
    taille: int = 20,
) -> tuple[int, list[Commande]]:
    conditions = []
    if statut is not None:
        conditions.append(Commande.statut == statut)
    if recherche and recherche.strip():
        motif = f"%{recherche.strip()}%"
        conditions.append(
            or_(
                Commande.reference.ilike(motif),
                Commande.nom_client.ilike(motif),
                Commande.telephone_client.ilike(motif),
            )
        )

    requete = select(Commande)
    for condition in conditions:
        requete = requete.where(condition)

    total = session.scalar(select(func.count()).select_from(requete.subquery())) or 0

    requete = (
        requete.order_by(Commande.cree_le.desc())
        .options(*_OPTIONS)
        .offset(max(page - 1, 0) * taille)
        .limit(taille)
    )
    return total, list(session.scalars(requete).all())


def _decrementer_stock(session: Session, commande: Commande) -> None:
    # Vérifie d'abord toute la disponibilité, puis applique (tout ou rien)
    produits = {}
    for ligne in commande.lignes:
        if ligne.produit_id is None:
            continue
        produit = session.get(Produit, ligne.produit_id)
        if produit is None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Le produit « {ligne.nom_produit} » n'existe plus",
            )
        if produit.quantite_stock < ligne.quantite:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Stock insuffisant pour « {produit.nom} » (disponible : {produit.quantite_stock})",
            )
        produits[ligne.id] = (produit, ligne.quantite)
    for produit, quantite in produits.values():
        produit.quantite_stock -= quantite


def _restocker(session: Session, commande: Commande) -> None:
    for ligne in commande.lignes:
        if ligne.produit_id is None:
            continue
        produit = session.get(Produit, ligne.produit_id)
        if produit is not None:
            produit.quantite_stock += ligne.quantite


def changer_statut(session: Session, commande_id: int, cible: StatutCommande) -> Commande:
    commande = obtenir(session, commande_id)
    if cible == commande.statut:
        return commande
    if cible not in TRANSITIONS[commande.statut]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Transition invalide : {commande.statut.value} → {cible.value}",
        )
    if cible == StatutCommande.validee:
        _decrementer_stock(session, commande)
    if cible == StatutCommande.annulee and commande.statut == StatutCommande.validee:
        _restocker(session, commande)
    commande.statut = cible
    session.commit()
    return obtenir(session, commande_id)


def annuler_par_reference(session: Session, reference: str) -> Commande:
    commande = obtenir_par_reference(session, reference)
    if commande.statut != StatutCommande.nouvelle:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Seule une commande encore « nouvelle » peut être annulée par le client",
        )
    commande.statut = StatutCommande.annulee
    session.commit()
    return obtenir(session, commande.id)


def modifier(session: Session, commande_id: int, donnees: CommandeModifierAdmin) -> Commande:
    commande = obtenir(session, commande_id)
    for champ, valeur in donnees.model_dump(exclude_unset=True).items():
        setattr(commande, champ, valeur)
    session.commit()
    return obtenir(session, commande_id)