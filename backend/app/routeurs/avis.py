from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import Utilisateur
from ..schemas.avis import (
    AvisAdmin,
    AvisAdminCreer,
    AvisCreer,
    AvisModifier,
    PageAvis,
    PageAvisAdmin,
)
from ..securite import exiger_admin, utilisateur_courant
from ..services import service_avis

# ----- Public : lecture des avis publiés ; dépôt réservé aux clients connectés -----
routeur = APIRouter(prefix="/api/avis", tags=["Avis"])


@routeur.get("", response_model=PageAvis)
def lister(
    produit_id: int | None = None,
    limite: int = Query(default=10, ge=1, le=50),
    decalage: int = Query(default=0, ge=0),
    session: Session = Depends(obtenir_session),
):
    moyenne, total, elements = service_avis.lister_publics(session, produit_id, limite, decalage)
    return PageAvis(moyenne=moyenne, total=total, elements=elements)


@routeur.post("", status_code=status.HTTP_201_CREATED)
def deposer(
    donnees: AvisCreer,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    service_avis.creer_client(session, donnees, utilisateur)
    return {"message": "Merci ! Votre avis sera visible après validation."}


# ----- Administration -----
routeur_admin = APIRouter(
    prefix="/api/admin/avis",
    tags=["Admin · Avis"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=PageAvisAdmin)
def lister_admin(
    statut: str | None = None,
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(obtenir_session),
):
    total, en_attente, elements = service_avis.lister_admin(session, statut, page, taille)
    return PageAvisAdmin(
        total=total, en_attente=en_attente, page=page, taille=taille, elements=elements
    )


@routeur_admin.post("", response_model=AvisAdmin, status_code=status.HTTP_201_CREATED)
def creer_admin(donnees: AvisAdminCreer, session: Session = Depends(obtenir_session)):
    return service_avis.creer_admin(session, donnees)


@routeur_admin.put("/{avis_id}", response_model=AvisAdmin)
def modifier(avis_id: int, donnees: AvisModifier, session: Session = Depends(obtenir_session)):
    return service_avis.modifier(session, avis_id, donnees)


@routeur_admin.delete("/{avis_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(avis_id: int, session: Session = Depends(obtenir_session)):
    service_avis.supprimer(session, avis_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
