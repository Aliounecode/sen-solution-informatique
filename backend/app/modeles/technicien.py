from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage


class Technicien(Base, Horodatage):
    """Technicien géré par l'admin, sans compte de connexion (v1)."""

    __tablename__ = "techniciens"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(120), nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    specialite: Mapped[str | None] = mapped_column(String(120), nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    demandes: Mapped[list["DemandeDepannage"]] = relationship(  # noqa: F821
        back_populates="technicien"
    )