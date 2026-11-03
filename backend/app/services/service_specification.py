from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..modeles import DefinitionSpecification
from ..schemas.specification import SpecificationCreer, SpecificationModifier
from ..utilitaires import slugifier


def lister(session: Session, inclure_inactifs: bool = False) -> list[DefinitionSpecification]:
    requete = select(DefinitionSpecification).order_by(
        DefinitionSpecification.ordre, DefinitionSpecification.libelle
    )
    if not inclure_inactifs:
        requete = requete.where(DefinitionSpecification.actif.is_(True))
    return list(session.scalars(requete).all())


def obtenir(session: Session, specification_id: int) -> DefinitionSpecification:
    specification = session.get(DefinitionSpecification, specification_id)
    if specification is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Spécification introuvable")
    return specification


def creer(session: Session, donnees: SpecificationCreer) -> DefinitionSpecification:
    cle = slugifier(donnees.cle).replace("-", "_")
    existe = session.scalar(
        select(DefinitionSpecification).where(DefinitionSpecification.cle == cle)
    )
    if existe:
        raise HTTPException(status.HTTP_409_CONFLICT, "Une spécification avec cette clé existe déjà")
    specification = DefinitionSpecification(
        cle=cle,
        libelle=donnees.libelle.strip(),
        groupe=donnees.groupe,
        type_valeur=donnees.type_valeur,
        unite=donnees.unite,
        options=donnees.options,
        ordre=donnees.ordre,
        actif=donnees.actif,
    )
    session.add(specification)
    session.commit()
    session.refresh(specification)
    return specification


def modifier(
    session: Session, specification_id: int, donnees: SpecificationModifier
) -> DefinitionSpecification:
    specification = obtenir(session, specification_id)
    valeurs = donnees.model_dump(exclude_unset=True)
    for champ, valeur in valeurs.items():
        setattr(specification, champ, valeur)
    session.commit()
    session.refresh(specification)
    return specification


def supprimer(session: Session, specification_id: int) -> None:
    specification = obtenir(session, specification_id)
    session.delete(specification)
    session.commit()