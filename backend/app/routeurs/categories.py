from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.categorie import CategorieCreer, CategorieModifier, CategoriePublic
from ..securite import exiger_admin
from ..services import service_categorie

routeur = APIRouter(prefix="/api/categories", tags=["Catégories"])


@routeur.get("", response_model=list[CategoriePublic])
def liste_publique(session: Session = Depends(obtenir_session)):
    return service_categorie.lister(session, inclure_inactifs=False)


routeur_admin = APIRouter(
    prefix="/api/admin/categories",
    tags=["Admin · Catégories"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=list[CategoriePublic])
def liste_admin(session: Session = Depends(obtenir_session)):
    return service_categorie.lister(session, inclure_inactifs=True)


@routeur_admin.post("", response_model=CategoriePublic, status_code=status.HTTP_201_CREATED)
def creer(donnees: CategorieCreer, session: Session = Depends(obtenir_session)):
    return service_categorie.creer(session, donnees)


@routeur_admin.put("/{categorie_id}", response_model=CategoriePublic)
def modifier(categorie_id: int, donnees: CategorieModifier, session: Session = Depends(obtenir_session)):
    return service_categorie.modifier(session, categorie_id, donnees)


@routeur_admin.delete("/{categorie_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(categorie_id: int, session: Session = Depends(obtenir_session)):
    service_categorie.supprimer(session, categorie_id)