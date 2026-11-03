from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..modeles import Technicien
from ..schemas.technicien import TechnicienCreer, TechnicienModifier


def lister(session: Session, inclure_inactifs: bool = False) -> list[Technicien]:
    requete = select(Technicien).order_by(Technicien.nom)
    if not inclure_inactifs:
        requete = requete.where(Technicien.actif.is_(True))
    return list(session.scalars(requete).all())


def obtenir(session: Session, technicien_id: int) -> Technicien:
    technicien = session.get(Technicien, technicien_id)
    if technicien is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Technicien introuvable")
    return technicien


def creer(session: Session, donnees: TechnicienCreer) -> Technicien:
    technicien = Technicien(
        nom=donnees.nom.strip(),
        telephone=donnees.telephone,
        specialite=donnees.specialite,
        actif=donnees.actif,
    )
    session.add(technicien)
    session.commit()
    session.refresh(technicien)
    return technicien


def modifier(session: Session, technicien_id: int, donnees: TechnicienModifier) -> Technicien:
    technicien = obtenir(session, technicien_id)
    for champ, valeur in donnees.model_dump(exclude_unset=True).items():
        setattr(technicien, champ, valeur)
    session.commit()
    session.refresh(technicien)
    return technicien


def supprimer(session: Session, technicien_id: int) -> None:
    technicien = obtenir(session, technicien_id)
    session.delete(technicien)
    session.commit()