from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage


class ImageProduit(Base, Horodatage):
    __tablename__ = "images_produit"

    id: Mapped[int] = mapped_column(primary_key=True)
    produit_id: Mapped[int] = mapped_column(
        ForeignKey("produits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    public_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Cloudinary
    ordre: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    est_principale: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    produit: Mapped["Produit"] = relationship(back_populates="images")  # noqa: F821