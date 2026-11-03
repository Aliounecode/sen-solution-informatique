from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.prestation import PrestationCreer, PrestationModifier, PrestationPublic
from ..securite import exiger_admin
from ..services import service_prestation

routeur = APIRouter(prefix="/api/prestations", tags=["Prestations"])


@routeur.get("", response_model=list[PrestationPublic])
def liste_publique(session: Session = Depends(obtenir_session)):
    return service_prestation.lister(session, inclure_inactifs=False)


@routeur.get("/{slug}", response_model=PrestationPublic)
def detail_public(slug: str, session: Session = Depends(obtenir_session)):
    return service_prestation.obtenir_par_slug(session, slug)


routeur_admin = APIRouter(
    prefix="/api/admin/prestations",
    tags=["Admin · Prestations"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=list[PrestationPublic])
def liste_admin(session: Session = Depends(obtenir_session)):
    return service_prestation.lister(session, inclure_inactifs=True)


@routeur_admin.post("", response_model=PrestationPublic, status_code=status.HTTP_201_CREATED)
def creer(donnees: PrestationCreer, session: Session = Depends(obtenir_session)):
    return service_prestation.creer(session, donnees)


@routeur_admin.put("/{prestation_id}", response_model=PrestationPublic)
def modifier(prestation_id: int, donnees: PrestationModifier, session: Session = Depends(obtenir_session)):
    return service_prestation.modifier(session, prestation_id, donnees)


@routeur_admin.delete("/{prestation_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(prestation_id: int, session: Session = Depends(obtenir_session)):
    service_prestation.supprimer(session, prestation_id)