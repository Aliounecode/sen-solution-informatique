from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, Horodatage


class Prestation(Base, Horodatage):
    """Service de dépannage proposé au catalogue (tarif fixe ou sur devis)."""

    __tablename__ = "prestations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(150), nullable=False)
    slug: Mapped[str] = mapped_column(String(170), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tarif: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FCFA, None = sur devis
    duree_estimee: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)