from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.technicien import TechnicienCreer, TechnicienModifier, TechnicienPublic
from ..securite import exiger_admin
from ..services import service_technicien

routeur_admin = APIRouter(
    prefix="/api/admin/techniciens",
    tags=["Admin · Techniciens"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=list[TechnicienPublic])
def liste(session: Session = Depends(obtenir_session)):
    return service_technicien.lister(session, inclure_inactifs=True)


@routeur_admin.post("", response_model=TechnicienPublic, status_code=status.HTTP_201_CREATED)
def creer(donnees: TechnicienCreer, session: Session = Depends(obtenir_session)):
    return service_technicien.creer(session, donnees)


@routeur_admin.put("/{technicien_id}", response_model=TechnicienPublic)
def modifier(technicien_id: int, donnees: TechnicienModifier, session: Session = Depends(obtenir_session)):
    return service_technicien.modifier(session, technicien_id, donnees)


@routeur_admin.delete("/{technicien_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(technicien_id: int, session: Session = Depends(obtenir_session)):
    service_technicien.supprimer(session, technicien_id)