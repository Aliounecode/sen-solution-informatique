from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .base_donnees import obtenir_session
from .configuration import parametres
from .modeles import RoleUtilisateur, Utilisateur

schema_bearer = HTTPBearer()
schema_bearer_optionnel = HTTPBearer(auto_error=False)

TYPE_ACCES = "acces"
TYPE_RAFRAICHISSEMENT = "rafraichissement"


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    hache = bcrypt.hashpw(mot_de_passe.encode("utf-8"), bcrypt.gensalt())
    return hache.decode("utf-8")


def verifier_mot_de_passe(mot_de_passe: str, hache: str) -> bool:
    return bcrypt.checkpw(mot_de_passe.encode("utf-8"), hache.encode("utf-8"))


def _creer_token(sujet: int, type_token: str, duree: timedelta) -> str:
    maintenant = datetime.now(timezone.utc)
    charge = {
        "sub": str(sujet),
        "type": type_token,
        "iat": maintenant,
        "exp": maintenant + duree,
    }
    return jwt.encode(charge, parametres.CLE_SECRETE, algorithm=parametres.ALGORITHME)


def creer_token_acces(id_utilisateur: int) -> str:
    return _creer_token(
        id_utilisateur, TYPE_ACCES,
        timedelta(minutes=parametres.DUREE_TOKEN_ACCES_MINUTES),
    )


def creer_token_rafraichissement(id_utilisateur: int) -> str:
    return _creer_token(
        id_utilisateur, TYPE_RAFRAICHISSEMENT,
        timedelta(days=parametres.DUREE_TOKEN_RAFRAICHISSEMENT_JOURS),
    )


def decoder_token(token: str) -> dict:
    try:
        return jwt.decode(token, parametres.CLE_SECRETE, algorithms=[parametres.ALGORITHME])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré",
        )


def utilisateur_courant(
    identifiants: HTTPAuthorizationCredentials = Depends(schema_bearer),
    session: Session = Depends(obtenir_session),
) -> Utilisateur:
    charge = decoder_token(identifiants.credentials)
    if charge.get("type") != TYPE_ACCES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Type de jeton incorrect")
    identifiant = charge.get("sub")
    utilisateur = session.get(Utilisateur, int(identifiant)) if identifiant else None
    if utilisateur is None or not utilisateur.actif:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur introuvable ou désactivé")
    return utilisateur


def utilisateur_courant_optionnel(
    identifiants: HTTPAuthorizationCredentials | None = Depends(schema_bearer_optionnel),
    session: Session = Depends(obtenir_session),
) -> Utilisateur | None:
    """Renvoie l'utilisateur si un jeton valide est présent, sinon None (invité)."""
    if identifiants is None:
        return None
    try:
        charge = decoder_token(identifiants.credentials)
    except HTTPException:
        return None
    if charge.get("type") != TYPE_ACCES:
        return None
    identifiant = charge.get("sub")
    utilisateur = session.get(Utilisateur, int(identifiant)) if identifiant else None
    return utilisateur if (utilisateur and utilisateur.actif) else None


def exiger_admin(utilisateur: Utilisateur = Depends(utilisateur_courant)) -> Utilisateur:
    if utilisateur.role != RoleUtilisateur.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès réservé à l'administrateur")
    return utilisateur