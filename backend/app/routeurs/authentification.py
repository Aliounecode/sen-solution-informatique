from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import Utilisateur
from ..schemas.authentification import Jeton, RafraichirRequete
from ..schemas.utilisateur import UtilisateurConnexion, UtilisateurCreer, UtilisateurPublic
from ..securite import (
    TYPE_RAFRAICHISSEMENT,
    creer_token_acces,
    creer_token_rafraichissement,
    decoder_token,
    utilisateur_courant,
)
from ..services import service_authentification

routeur = APIRouter(prefix="/api/auth", tags=["Authentification"])


@routeur.post("/inscription", response_model=UtilisateurPublic, status_code=status.HTTP_201_CREATED)
def inscription(donnees: UtilisateurCreer, session: Session = Depends(obtenir_session)):
    return service_authentification.inscrire(session, donnees)


@routeur.post("/connexion", response_model=Jeton)
def connexion(donnees: UtilisateurConnexion, session: Session = Depends(obtenir_session)):
    utilisateur = service_authentification.authentifier(session, donnees.email, donnees.mot_de_passe)
    return Jeton(
        token_acces=creer_token_acces(utilisateur.id),
        token_rafraichissement=creer_token_rafraichissement(utilisateur.id),
    )


@routeur.post("/rafraichir", response_model=Jeton)
def rafraichir(donnees: RafraichirRequete, session: Session = Depends(obtenir_session)):
    charge = decoder_token(donnees.token_rafraichissement)
    if charge.get("type") != TYPE_RAFRAICHISSEMENT:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton de rafraîchissement attendu")
    utilisateur = session.get(Utilisateur, int(charge["sub"]))
    if not utilisateur or not utilisateur.actif:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur invalide")
    return Jeton(
        token_acces=creer_token_acces(utilisateur.id),
        token_rafraichissement=creer_token_rafraichissement(utilisateur.id),
    )


@routeur.get("/moi", response_model=UtilisateurPublic)
def moi(utilisateur: Utilisateur = Depends(utilisateur_courant)):
    return utilisateur
