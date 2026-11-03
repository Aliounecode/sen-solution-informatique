from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import RoleUtilisateur, Utilisateur
from ..schemas.utilisateur import (
    PageUtilisateurs,
    ReinitialiserMotDePasse,
    UtilisateurCreerAdmin,
    UtilisateurModifierAdmin,
    UtilisateurPublic,
)
from ..securite import exiger_admin
from ..services import service_utilisateur

routeur_admin = APIRouter(prefix="/api/admin/utilisateurs", tags=["Admin · Utilisateurs"])


@routeur_admin.get("", response_model=PageUtilisateurs)
def liste(
    session: Session = Depends(obtenir_session),
    _: Utilisateur = Depends(exiger_admin),
    role: RoleUtilisateur | None = None,
    recherche: str | None = None,
    actif: bool | None = None,
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=20, ge=1, le=100),
):
    total, elements = service_utilisateur.lister(
        session, role=role, recherche=recherche, actif=actif, page=page, taille=taille
    )
    return PageUtilisateurs(total=total, page=page, taille=taille, elements=elements)


@routeur_admin.post("", response_model=UtilisateurPublic, status_code=status.HTTP_201_CREATED)
def creer(
    donnees: UtilisateurCreerAdmin,
    session: Session = Depends(obtenir_session),
    _: Utilisateur = Depends(exiger_admin),
):
    return service_utilisateur.creer(session, donnees)


@routeur_admin.get("/{utilisateur_id}", response_model=UtilisateurPublic)
def detail(
    utilisateur_id: int,
    session: Session = Depends(obtenir_session),
    _: Utilisateur = Depends(exiger_admin),
):
    return service_utilisateur.obtenir(session, utilisateur_id)


@routeur_admin.put("/{utilisateur_id}", response_model=UtilisateurPublic)
def modifier(
    utilisateur_id: int,
    donnees: UtilisateurModifierAdmin,
    session: Session = Depends(obtenir_session),
    admin: Utilisateur = Depends(exiger_admin),
):
    return service_utilisateur.modifier(session, utilisateur_id, donnees, acteur_id=admin.id)


@routeur_admin.post("/{utilisateur_id}/reinitialiser-mot-de-passe", response_model=UtilisateurPublic)
def reinitialiser_mot_de_passe(
    utilisateur_id: int,
    donnees: ReinitialiserMotDePasse,
    session: Session = Depends(obtenir_session),
    _: Utilisateur = Depends(exiger_admin),
):
    return service_utilisateur.reinitialiser_mot_de_passe(
        session, utilisateur_id, donnees.nouveau_mot_de_passe
    )