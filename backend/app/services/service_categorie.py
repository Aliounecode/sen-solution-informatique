from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..modeles import Categorie
from ..schemas.categorie import CategorieCreer, CategorieModifier
from ..utilitaires import slug_unique


def _valider_parent(session: Session, parent_id: int | None, exclure_id: int | None = None):
    if parent_id is None:
        return
    if parent_id == exclure_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Une catégorie ne peut être son propre parent")
    if session.get(Categorie, parent_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catégorie parente introuvable")


def lister(session: Session, inclure_inactifs: bool = False) -> list[Categorie]:
    requete = select(Categorie).order_by(Categorie.ordre, Categorie.nom)
    if not inclure_inactifs:
        requete = requete.where(Categorie.actif.is_(True))
    return list(session.scalars(requete).all())


def obtenir(session: Session, categorie_id: int) -> Categorie:
    categorie = session.get(Categorie, categorie_id)
    if categorie is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catégorie introuvable")
    return categorie


def creer(session: Session, donnees: CategorieCreer) -> Categorie:
    _valider_parent(session, donnees.parent_id)
    categorie = Categorie(
        nom=donnees.nom.strip(),
        slug=slug_unique(session, Categorie, donnees.nom),
        description=donnees.description,
        parent_id=donnees.parent_id,
        ordre=donnees.ordre,
        actif=donnees.actif,
    )
    session.add(categorie)
    session.commit()
    session.refresh(categorie)
    return categorie


def modifier(session: Session, categorie_id: int, donnees: CategorieModifier) -> Categorie:
    categorie = obtenir(session, categorie_id)
    valeurs = donnees.model_dump(exclude_unset=True)
    if "parent_id" in valeurs:
        _valider_parent(session, valeurs["parent_id"], exclure_id=categorie_id)
    if "nom" in valeurs and valeurs["nom"]:
        categorie.nom = valeurs["nom"].strip()
        categorie.slug = slug_unique(session, Categorie, categorie.nom, exclure_id=categorie_id)
    for champ in ("description", "parent_id", "ordre", "actif"):
        if champ in valeurs:
            setattr(categorie, champ, valeurs[champ])
    session.commit()
    session.refresh(categorie)
    return categorie


def supprimer(session: Session, categorie_id: int) -> None:
    categorie = obtenir(session, categorie_id)
    if categorie.produits:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Impossible de supprimer une catégorie contenant des produits",
        )
    session.delete(categorie)
    session.commit()