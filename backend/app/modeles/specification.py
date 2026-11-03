import enum

from sqlalchemy import JSON, Boolean, Enum, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, Horodatage

# JSON portable : JSONB sous PostgreSQL, JSON ailleurs (tests)
JSON_VARIANT = JSON().with_variant(JSONB(), "postgresql")


class TypeValeur(str, enum.Enum):
    texte = "texte"
    nombre = "nombre"
    booleen = "booleen"
    liste = "liste"


class DefinitionSpecification(Base, Horodatage):
    """Définition d'une caractéristique technique, gérée par l'admin.

    Les produits stockent leurs valeurs dans la colonne JSONB `caracteristiques`
    en utilisant la `cle` de ces définitions.
    """

    __tablename__ = "definitions_specifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    cle: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    libelle: Mapped[str] = mapped_column(String(120), nullable=False)
    groupe: Mapped[str | None] = mapped_column(String(80), nullable=True)
    type_valeur: Mapped[TypeValeur] = mapped_column(
        Enum(TypeValeur, name="type_valeur_specification"),
        default=TypeValeur.texte,
        nullable=False,
    )
    unite: Mapped[str | None] = mapped_column(String(20), nullable=True)
    options: Mapped[list | None] = mapped_column(JSON_VARIANT, nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)