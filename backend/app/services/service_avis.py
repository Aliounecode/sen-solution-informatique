from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..modeles import Avis, Produit, Utilisateur
from ..schemas.avis import AvisAdminCreer, AvisCreer, AvisModifier


def _verifier_produit(session: Session, produit_id: int | None) -> None:
    if produit_id is not None and session.get(Produit, produit_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produit introuvable")


def lister_publics(
    session: Session, produit_id: int | None, limite: int, decalage: int
) -> tuple[float | None, int, list[Avis]]:
    """Avis publiés : ceux d'un produit, ou tous (accueil) si produit_id est None."""
    filtre = [Avis.statut == "publie"]
    if produit_id is not None:
        filtre.append(Avis.produit_id == produit_id)
    moyenne, total = session.execute(
        select(func.avg(Avis.note), func.count(Avis.id)).where(*filtre)
    ).one()
    elements = list(
        session.scalars(
            select(Avis)
            .options(selectinload(Avis.produit))
            .where(*filtre)
            .order_by(Avis.cree_le.desc(), Avis.id.desc())
            .limit(limite)
            .offset(decalage)
        )
    )
    return (round(float(moyenne), 1) if moyenne is not None else None), total, elements


def creer_client(session: Session, donnees: AvisCreer, utilisateur: Utilisateur) -> Avis:
    _verifier_produit(session, donnees.produit_id)
    existant = session.scalar(
        select(Avis.id).where(
            Avis.utilisateur_id == utilisateur.id,
            Avis.produit_id.is_(None) if donnees.produit_id is None else Avis.produit_id == donnees.produit_id,
        )
    )
    if existant is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Vous avez déjà laissé un avis ici. Merci pour votre retour !",
        )
    avis = Avis(
        produit_id=donnees.produit_id,
        utilisateur_id=utilisateur.id,
        nom_affiche=(donnees.nom_affiche or utilisateur.nom_complet).strip()[:80],
        note=donnees.note,
        commentaire=donnees.commentaire.strip(),
        statut="en_attente",
    )
    session.add(avis)
    session.commit()
    session.refresh(avis)
    return avis


# ----- Administration -----
def lister_admin(
    session: Session, statut: str | None, page: int, taille: int
) -> tuple[int, int, list[Avis]]:
    requete = select(Avis).options(selectinload(Avis.produit))
    compte = select(func.count(Avis.id))
    if statut:
        requete = requete.where(Avis.statut == statut)
        compte = compte.where(Avis.statut == statut)
    total = session.scalar(compte) or 0
    en_attente = session.scalar(select(func.count(Avis.id)).where(Avis.statut == "en_attente")) or 0
    elements = list(
        session.scalars(
            requete.order_by(Avis.cree_le.desc(), Avis.id.desc())
            .limit(taille)
            .offset((page - 1) * taille)
        )
    )
    return total, en_attente, elements


def _obtenir(session: Session, avis_id: int) -> Avis:
    avis = session.get(Avis, avis_id)
    if avis is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Avis introuvable")
    return avis


def creer_admin(session: Session, donnees: AvisAdminCreer) -> Avis:
    _verifier_produit(session, donnees.produit_id)
    avis = Avis(**donnees.model_dump())
    session.add(avis)
    session.commit()
    session.refresh(avis)
    return avis


def modifier(session: Session, avis_id: int, donnees: AvisModifier) -> Avis:
    avis = _obtenir(session, avis_id)
    for champ, valeur in donnees.model_dump(exclude_unset=True).items():
        if valeur is not None:
            setattr(avis, champ, valeur)
    session.commit()
    session.refresh(avis)
    return avis


def supprimer(session: Session, avis_id: int) -> None:
    session.delete(_obtenir(session, avis_id))
    session.commit()
