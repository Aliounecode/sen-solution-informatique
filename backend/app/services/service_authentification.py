from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..modeles import RoleUtilisateur, Utilisateur
from ..schemas.utilisateur import UtilisateurCreer
from ..securite import hacher_mot_de_passe, verifier_mot_de_passe
from .service_utilisateur import obtenir_par_email


def inscrire(session: Session, donnees: UtilisateurCreer) -> Utilisateur:
    if obtenir_par_email(session, donnees.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Un compte existe déjà avec cet e-mail")
    utilisateur = Utilisateur(
        nom_complet=donnees.nom_complet.strip(),
        email=donnees.email.lower(),
        telephone=donnees.telephone,
        mot_de_passe_hash=hacher_mot_de_passe(donnees.mot_de_passe),
        role=RoleUtilisateur.client,
    )
    session.add(utilisateur)
    session.commit()
    session.refresh(utilisateur)
    return utilisateur


def authentifier(session: Session, email: str, mot_de_passe: str) -> Utilisateur:
    utilisateur = obtenir_par_email(session, email)
    if not utilisateur or not verifier_mot_de_passe(mot_de_passe, utilisateur.mot_de_passe_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou mot de passe incorrect")
    if not utilisateur.actif:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Compte désactivé")
    return utilisateur
