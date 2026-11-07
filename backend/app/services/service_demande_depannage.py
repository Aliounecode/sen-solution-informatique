from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..modeles import (
    DemandeDepannage,
    Prestation,
    RoleUtilisateur,
    StatutDemande,
    Technicien,
    Utilisateur,
)
from ..schemas.demande_depannage import DemandeCreer, DemandeModifierAdmin

# Transitions autorisées de la machine à états
TRANSITIONS: dict[StatutDemande, set[StatutDemande]] = {
    StatutDemande.recue: {StatutDemande.diagnostic, StatutDemande.annulee},
    StatutDemande.diagnostic: {
        StatutDemande.devis,
        StatutDemande.en_reparation,
        StatutDemande.annulee,
    },
    StatutDemande.devis: {StatutDemande.en_reparation, StatutDemande.annulee},
    StatutDemande.en_reparation: {StatutDemande.prete, StatutDemande.annulee},
    StatutDemande.prete: {StatutDemande.livree, StatutDemande.annulee},
    StatutDemande.livree: set(),
    StatutDemande.annulee: set(),
}

_OPTIONS = (selectinload(DemandeDepannage.technicien), selectinload(DemandeDepannage.prestation))


def _valider_prestation(session: Session, prestation_id: int | None) -> None:
    if prestation_id is not None and session.get(Prestation, prestation_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prestation introuvable")


def _valider_technicien(session: Session, technicien_id: int | None) -> None:
    if technicien_id is not None and session.get(Technicien, technicien_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Technicien introuvable")


def creer(session: Session, donnees: DemandeCreer, client_id: int | None = None) -> DemandeDepannage:
    _valider_prestation(session, donnees.prestation_id)
    demande = DemandeDepannage(
        reference="",  # défini après flush pour utiliser l'id
        client_id=client_id,
        nom_client=donnees.nom_client.strip(),
        telephone_client=donnees.telephone_client.strip(),
        email_client=(donnees.email_client or None),
        type_appareil=donnees.type_appareil.strip(),
        marque_appareil=donnees.marque_appareil,
        modele_appareil=donnees.modele_appareil,
        description_panne=donnees.description_panne.strip(),
        prestation_id=donnees.prestation_id,
        statut=StatutDemande.recue,
    )
    session.add(demande)
    session.flush()
    demande.reference = f"DEP-{datetime.now(timezone.utc).year}-{demande.id:05d}"
    session.commit()
    return obtenir(session, demande.id)


def obtenir(session: Session, demande_id: int) -> DemandeDepannage:
    demande = session.scalar(
        select(DemandeDepannage).where(DemandeDepannage.id == demande_id).options(*_OPTIONS)
    )
    if demande is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demande introuvable")
    return demande


def obtenir_par_reference(session: Session, reference: str) -> DemandeDepannage:
    demande = session.scalar(
        select(DemandeDepannage)
        .where(DemandeDepannage.reference == reference.strip().upper())
        .options(*_OPTIONS)
    )
    if demande is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demande introuvable")
    return demande


def obtenir_par_reference_pour(
    session: Session, reference: str, utilisateur: Utilisateur
) -> DemandeDepannage:
    """Renvoie la demande seulement si elle appartient à l'utilisateur (ou s'il est admin)."""
    demande = obtenir_par_reference(session, reference)
    if utilisateur.role != RoleUtilisateur.admin and demande.client_id != utilisateur.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Demande introuvable")
    return demande


def lister_pour_client(session: Session, client_id: int) -> list[DemandeDepannage]:
    return list(
        session.scalars(
            select(DemandeDepannage)
            .where(DemandeDepannage.client_id == client_id)
            .order_by(DemandeDepannage.cree_le.desc())
            .options(*_OPTIONS)
        ).all()
    )


def lister(
    session: Session,
    *,
    statut: StatutDemande | None = None,
    technicien_id: int | None = None,
    recherche: str | None = None,
    page: int = 1,
    taille: int = 20,
) -> tuple[int, list[DemandeDepannage]]:
    conditions = []
    if statut is not None:
        conditions.append(DemandeDepannage.statut == statut)
    if technicien_id is not None:
        conditions.append(DemandeDepannage.technicien_id == technicien_id)
    if recherche and recherche.strip():
        motif = f"%{recherche.strip()}%"
        conditions.append(
            or_(
                DemandeDepannage.reference.ilike(motif),
                DemandeDepannage.nom_client.ilike(motif),
                DemandeDepannage.telephone_client.ilike(motif),
                DemandeDepannage.type_appareil.ilike(motif),
            )
        )

    requete = select(DemandeDepannage)
    for condition in conditions:
        requete = requete.where(condition)

    total = session.scalar(select(func.count()).select_from(requete.subquery())) or 0

    requete = (
        requete.order_by(DemandeDepannage.cree_le.desc())
        .options(*_OPTIONS)
        .offset(max(page - 1, 0) * taille)
        .limit(taille)
    )
    return total, list(session.scalars(requete).all())


def modifier(session: Session, demande_id: int, donnees: DemandeModifierAdmin) -> DemandeDepannage:
    demande = obtenir(session, demande_id)
    valeurs = donnees.model_dump(exclude_unset=True)
    if "prestation_id" in valeurs:
        _valider_prestation(session, valeurs["prestation_id"])
    if "technicien_id" in valeurs:
        _valider_technicien(session, valeurs["technicien_id"])
    for champ, valeur in valeurs.items():
        setattr(demande, champ, valeur)
    session.commit()
    return obtenir(session, demande_id)


def changer_statut(session: Session, demande_id: int, cible: StatutDemande) -> DemandeDepannage:
    demande = obtenir(session, demande_id)
    if cible == demande.statut:
        return demande
    if cible not in TRANSITIONS[demande.statut]:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Transition invalide : {demande.statut.value} → {cible.value}",
        )
    demande.statut = cible
    session.commit()
    return obtenir(session, demande_id)


def repondre_devis(
    session: Session, reference: str, accepte: bool, utilisateur: Utilisateur
) -> DemandeDepannage:
    demande = obtenir_par_reference_pour(session, reference, utilisateur)
    if demande.statut != StatutDemande.devis:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Aucun devis en attente de réponse pour cette demande",
        )
    demande.devis_accepte = accepte
    demande.statut = StatutDemande.en_reparation if accepte else StatutDemande.annulee
    session.commit()
    return obtenir(session, demande.id)