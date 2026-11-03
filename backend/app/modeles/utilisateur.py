import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, Horodatage


class RoleUtilisateur(str, enum.Enum):
    client = "client"
    admin = "admin"


class Utilisateur(Base, Horodatage):
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_complet: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleUtilisateur] = mapped_column(
        Enum(RoleUtilisateur, name="role_utilisateur"),
        default=RoleUtilisateur.client,
        nullable=False,
    )
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
