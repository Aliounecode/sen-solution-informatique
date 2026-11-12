from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage

STATUTS_AVIS = ("en_attente", "publie", "refuse")


class Avis(Base, Horodatage):
    """Avis client, sur un produit précis ou sur le site en général (produit_id NULL).

    Un avis déposé par un client reste « en_attente » tant que l'admin ne l'a pas publié.
    """

    __tablename__ = "avis"

    id: Mapped[int] = mapped_column(primary_key=True)
    produit_id: Mapped[int | None] = mapped_column(
        ForeignKey("produits.id", ondelete="CASCADE"), nullable=True, index=True
    )
    utilisateur_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    nom_affiche: Mapped[str] = mapped_column(String(80), nullable=False)
    note: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 à 5
    commentaire: Mapped[str] = mapped_column(Text, nullable=False)
    statut: Mapped[str] = mapped_column(
        String(20), default="en_attente", server_default="en_attente", nullable=False, index=True
    )

    produit: Mapped["Produit | None"] = relationship()  # noqa: F821

    @property
    def produit_nom(self) -> str | None:
        return self.produit.nom if self.produit else None

    @property
    def produit_slug(self) -> str | None:
        return self.produit.slug if self.produit else None
