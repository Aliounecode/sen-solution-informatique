"""Création d'un compte administrateur.

Usage (venv activé, depuis backend/) :
    python creer_admin.py
"""
from getpass import getpass

from app.base_donnees import SessionLocale
from app.modeles import RoleUtilisateur, Utilisateur
from app.securite import hacher_mot_de_passe
from app.services.service_utilisateur import obtenir_par_email


def principal():
    session = SessionLocale()
    try:
        email = input("E-mail admin : ").strip().lower()
        if obtenir_par_email(session, email):
            print("Un compte existe déjà avec cet e-mail.")
            return
        nom = input("Nom complet : ").strip()
        mot_de_passe = getpass("Mot de passe : ")
        admin = Utilisateur(
            nom_complet=nom,
            email=email,
            mot_de_passe_hash=hacher_mot_de_passe(mot_de_passe),
            role=RoleUtilisateur.admin,
        )
        session.add(admin)
        session.commit()
        print(f"Administrateur créé : {email}")
    finally:
        session.close()


if __name__ == "__main__":
    principal()
