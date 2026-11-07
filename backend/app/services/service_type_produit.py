from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..modeles import DefinitionSpecification, Produit, TypeDeProduit
from ..schemas.type_produit import TypeProduitCreer, TypeProduitModifier
from ..utilitaires import slug_unique


def lister(session: Session, inclure_inactifs: bool = False) -> list[TypeDeProduit]:
    requete = select(TypeDeProduit).order_by(TypeDeProduit.ordre, TypeDeProduit.libelle)
    if not inclure_inactifs:
        requete = requete.where(TypeDeProduit.actif.is_(True))
    return list(session.scalars(requete).all())


def obtenir(session: Session, type_id: int) -> TypeDeProduit:
    type_produit = session.get(TypeDeProduit, type_id)
    if type_produit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Type de produit introuvable")
    return type_produit


def existe(session: Session, slug: str) -> bool:
    return session.scalar(select(TypeDeProduit.id).where(TypeDeProduit.slug == slug)) is not None


def creer(session: Session, donnees: TypeProduitCreer) -> TypeDeProduit:
    type_produit = TypeDeProduit(
        slug=slug_unique(session, TypeDeProduit, donnees.libelle),
        libelle=donnees.libelle.strip(),
        ordre=donnees.ordre,
        actif=donnees.actif,
    )
    session.add(type_produit)
    session.commit()
    session.refresh(type_produit)
    return type_produit


def modifier(session: Session, type_id: int, donnees: TypeProduitModifier) -> TypeDeProduit:
    type_produit = obtenir(session, type_id)
    for champ, valeur in donnees.model_dump(exclude_unset=True).items():
        if valeur is None:
            continue
        setattr(type_produit, champ, valeur.strip() if isinstance(valeur, str) else valeur)
    session.commit()
    session.refresh(type_produit)
    return type_produit


def supprimer(session: Session, type_id: int) -> None:
    type_produit = obtenir(session, type_id)
    utilises = session.scalar(
        select(func.count()).select_from(Produit).where(Produit.type_produit == type_produit.slug)
    )
    if utilises:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{utilises} produit(s) utilisent ce type. Désactivez-le plutôt que de le supprimer.",
        )
    # Retire le type des caractéristiques qui le mentionnaient
    for specification in session.scalars(select(DefinitionSpecification)).all():
        if specification.types and type_produit.slug in specification.types:
            specification.types = [t for t in specification.types if t != type_produit.slug] or None
    session.delete(type_produit)
    session.commit()