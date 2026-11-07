from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, Horodatage


class TypeDeProduit(Base, Horodatage):
    """Famille de produits gérée par l'admin (ordinateur, accessoire, console…).

    `Produit.type_produit` stocke le `slug` de cette table.
    """

    __tablename__ = "types_produits"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    libelle: Mapped[str] = mapped_column(String(60), nullable=False)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)