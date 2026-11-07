from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.type_produit import (
    TypeProduitCreer,
    TypeProduitModifier,
    TypeProduitPublic,
)
from ..securite import exiger_admin
from ..services import service_type_produit

routeur = APIRouter(prefix="/api/types", tags=["Types de produits"])


@routeur.get("", response_model=list[TypeProduitPublic])
def liste_publique(session: Session = Depends(obtenir_session)):
    return service_type_produit.lister(session, inclure_inactifs=False)


routeur_admin = APIRouter(
    prefix="/api/admin/types",
    tags=["Admin · Types de produits"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=list[TypeProduitPublic])
def liste_admin(session: Session = Depends(obtenir_session)):
    return service_type_produit.lister(session, inclure_inactifs=True)


@routeur_admin.post("", response_model=TypeProduitPublic, status_code=status.HTTP_201_CREATED)
def creer(donnees: TypeProduitCreer, session: Session = Depends(obtenir_session)):
    return service_type_produit.creer(session, donnees)


@routeur_admin.put("/{type_id}", response_model=TypeProduitPublic)
def modifier(type_id: int, donnees: TypeProduitModifier, session: Session = Depends(obtenir_session)):
    return service_type_produit.modifier(session, type_id, donnees)


@routeur_admin.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(type_id: int, session: Session = Depends(obtenir_session)):
    service_type_produit.supprimer(session, type_id)