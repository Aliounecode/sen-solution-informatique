from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.specification import (
    SpecificationCreer,
    SpecificationModifier,
    SpecificationPublic,
)
from ..securite import exiger_admin
from ..services import service_specification

routeur = APIRouter(prefix="/api/specifications", tags=["Spécifications"])


@routeur.get("", response_model=list[SpecificationPublic])
def liste_publique(session: Session = Depends(obtenir_session)):
    return service_specification.lister(session, inclure_inactifs=False)


routeur_admin = APIRouter(
    prefix="/api/admin/specifications",
    tags=["Admin · Spécifications"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=list[SpecificationPublic])
def liste_admin(session: Session = Depends(obtenir_session)):
    return service_specification.lister(session, inclure_inactifs=True)


@routeur_admin.post("", response_model=SpecificationPublic, status_code=status.HTTP_201_CREATED)
def creer(donnees: SpecificationCreer, session: Session = Depends(obtenir_session)):
    return service_specification.creer(session, donnees)


@routeur_admin.put("/{specification_id}", response_model=SpecificationPublic)
def modifier(specification_id: int, donnees: SpecificationModifier, session: Session = Depends(obtenir_session)):
    return service_specification.modifier(session, specification_id, donnees)


@routeur_admin.delete("/{specification_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(specification_id: int, session: Session = Depends(obtenir_session)):
    service_specification.supprimer(session, specification_id)