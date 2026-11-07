from sqlalchemy import (
    JSON,
    Boolean,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage

JSON_VARIANT = JSON().with_variant(JSONB(), "postgresql")


class Produit(Base, Horodatage):
    __tablename__ = "produits"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    categorie_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    # Slug d'un TypeDeProduit (ordinateur, accessoire, console…)
    type_produit: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    marque: Mapped[str | None] = mapped_column(String(80), nullable=True)
    modele: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prix: Mapped[int] = mapped_column(Integer, nullable=False)  # en FCFA (entier)
    prix_promo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    promo_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    quantite_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    caracteristiques: Mapped[dict] = mapped_column(
        JSON_VARIANT, default=dict, server_default=text("'{}'"), nullable=False
    )
    en_vedette: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    categorie: Mapped["Categorie"] = relationship(back_populates="produits")  # noqa: F821
    images: Mapped[list["ImageProduit"]] = relationship(  # noqa: F821
        back_populates="produit",
        cascade="all, delete-orphan",
        order_by="ImageProduit.ordre",
    )