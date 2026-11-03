from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage


class Categorie(Base, Horodatage):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    enfants: Mapped[list["Categorie"]] = relationship(back_populates="parent")
    parent: Mapped["Categorie | None"] = relationship(
        back_populates="enfants", remote_side=[id]
    )
    produits: Mapped[list["Produit"]] = relationship(back_populates="categorie")  # noqa: F821