from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..modeles import RoleUtilisateur, Utilisateur
from ..schemas.utilisateur import (
    UtilisateurCreerAdmin,
    UtilisateurModifierAdmin,
)
from ..securite import hacher_mot_de_passe


def obtenir_par_email(session: Session, email: str) -> Utilisateur | None:
    return session.scalar(select(Utilisateur).where(Utilisateur.email == email.lower()))


def obtenir(session: Session, utilisateur_id: int) -> Utilisateur:
    utilisateur = session.get(Utilisateur, utilisateur_id)
    if utilisateur is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Utilisateur introuvable")
    return utilisateur


def _nombre_admins_actifs(session: Session) -> int:
    return session.scalar(
        select(func.count())
        .select_from(Utilisateur)
        .where(Utilisateur.role == RoleUtilisateur.admin, Utilisateur.actif.is_(True))
    ) or 0


def lister(
    session: Session,
    *,
    role: RoleUtilisateur | None = None,
    recherche: str | None = None,
    actif: bool | None = None,
    page: int = 1,
    taille: int = 20,
) -> tuple[int, list[Utilisateur]]:
    conditions = []
    if role is not None:
        conditions.append(Utilisateur.role == role)
    if actif is not None:
        conditions.append(Utilisateur.actif.is_(actif))
    if recherche and recherche.strip():
        motif = f"%{recherche.strip()}%"
        conditions.append(
            or_(
                Utilisateur.nom_complet.ilike(motif),
                Utilisateur.email.ilike(motif),
                Utilisateur.telephone.ilike(motif),
            )
        )

    requete = select(Utilisateur)
    for condition in conditions:
        requete = requete.where(condition)

    total = session.scalar(select(func.count()).select_from(requete.subquery())) or 0

    requete = (
        requete.order_by(Utilisateur.cree_le.desc())
        .offset(max(page - 1, 0) * taille)
        .limit(taille)
    )
    return total, list(session.scalars(requete).all())


def creer(session: Session, donnees: UtilisateurCreerAdmin) -> Utilisateur:
    if obtenir_par_email(session, donnees.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Un compte existe déjà avec cet e-mail")
    utilisateur = Utilisateur(
        nom_complet=donnees.nom_complet.strip(),
        email=donnees.email.lower(),
        telephone=donnees.telephone,
        mot_de_passe_hash=hacher_mot_de_passe(donnees.mot_de_passe),
        role=donnees.role,
    )
    session.add(utilisateur)
    session.commit()
    session.refresh(utilisateur)
    return utilisateur


def modifier(
    session: Session,
    utilisateur_id: int,
    donnees: UtilisateurModifierAdmin,
    acteur_id: int,
) -> Utilisateur:
    utilisateur = obtenir(session, utilisateur_id)
    valeurs = donnees.model_dump(exclude_unset=True)

    retrograde = (
        "role" in valeurs
        and valeurs["role"] != RoleUtilisateur.admin
        and utilisateur.role == RoleUtilisateur.admin
    )
    desactive = "actif" in valeurs and valeurs["actif"] is False and utilisateur.actif

    if retrograde or desactive:
        if utilisateur.id == acteur_id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Vous ne pouvez pas vous rétrograder ni vous désactiver vous-même",
            )
        if (
            utilisateur.role == RoleUtilisateur.admin
            and utilisateur.actif
            and _nombre_admins_actifs(session) <= 1
        ):
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Impossible de désactiver ou rétrograder le dernier administrateur actif",
            )

    for champ in ("nom_complet", "telephone", "role", "actif"):
        if champ in valeurs:
            setattr(utilisateur, champ, valeurs[champ])
    session.commit()
    session.refresh(utilisateur)
    return utilisateur


def reinitialiser_mot_de_passe(session: Session, utilisateur_id: int, nouveau: str) -> Utilisateur:
    utilisateur = obtenir(session, utilisateur_id)
    utilisateur.mot_de_passe_hash = hacher_mot_de_passe(nouveau)
    session.commit()
    session.refresh(utilisateur)
    return utilisateur