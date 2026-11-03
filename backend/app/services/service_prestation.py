from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..modeles import Prestation
from ..schemas.prestation import PrestationCreer, PrestationModifier
from ..utilitaires import slug_unique


def lister(session: Session, inclure_inactifs: bool = False) -> list[Prestation]:
    requete = select(Prestation).order_by(Prestation.ordre, Prestation.nom)
    if not inclure_inactifs:
        requete = requete.where(Prestation.actif.is_(True))
    return list(session.scalars(requete).all())


def obtenir(session: Session, prestation_id: int) -> Prestation:
    prestation = session.get(Prestation, prestation_id)
    if prestation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prestation introuvable")
    return prestation


def obtenir_par_slug(session: Session, slug: str) -> Prestation:
    prestation = session.scalar(
        select(Prestation).where(Prestation.slug == slug, Prestation.actif.is_(True))
    )
    if prestation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prestation introuvable")
    return prestation


def creer(session: Session, donnees: PrestationCreer) -> Prestation:
    prestation = Prestation(
        nom=donnees.nom.strip(),
        slug=slug_unique(session, Prestation, donnees.nom),
        description=donnees.description,
        tarif=donnees.tarif,
        duree_estimee=donnees.duree_estimee,
        ordre=donnees.ordre,
        actif=donnees.actif,
    )
    session.add(prestation)
    session.commit()
    session.refresh(prestation)
    return prestation


def modifier(session: Session, prestation_id: int, donnees: PrestationModifier) -> Prestation:
    prestation = obtenir(session, prestation_id)
    valeurs = donnees.model_dump(exclude_unset=True)
    if "nom" in valeurs and valeurs["nom"]:
        prestation.nom = valeurs["nom"].strip()
        prestation.slug = slug_unique(session, Prestation, prestation.nom, exclure_id=prestation_id)
    for champ in ("description", "tarif", "duree_estimee", "ordre", "actif"):
        if champ in valeurs:
            setattr(prestation, champ, valeurs[champ])
    session.commit()
    session.refresh(prestation)
    return prestation


def supprimer(session: Session, prestation_id: int) -> None:
    prestation = obtenir(session, prestation_id)
    session.delete(prestation)
    session.commit()