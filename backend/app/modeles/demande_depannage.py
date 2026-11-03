import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage


class StatutDemande(str, enum.Enum):
    recue = "recue"
    diagnostic = "diagnostic"
    devis = "devis"
    en_reparation = "en_reparation"
    prete = "prete"
    livree = "livree"
    annulee = "annulee"


class DemandeDepannage(Base, Horodatage):
    __tablename__ = "demandes_depannage"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)

    # Coordonnées (invité ou client connecté)
    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    nom_client: Mapped[str] = mapped_column(String(120), nullable=False)
    telephone_client: Mapped[str] = mapped_column(String(30), nullable=False)
    email_client: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Appareil et panne
    type_appareil: Mapped[str] = mapped_column(String(120), nullable=False)
    marque_appareil: Mapped[str | None] = mapped_column(String(80), nullable=True)
    modele_appareil: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description_panne: Mapped[str] = mapped_column(Text, nullable=False)
    prestation_id: Mapped[int | None] = mapped_column(
        ForeignKey("prestations.id", ondelete="SET NULL"), nullable=True
    )

    # Suivi / workflow
    statut: Mapped[StatutDemande] = mapped_column(
        Enum(StatutDemande, name="statut_demande"),
        default=StatutDemande.recue,
        nullable=False,
        index=True,
    )
    diagnostic: Mapped[str | None] = mapped_column(Text, nullable=True)
    montant_devis: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FCFA
    devis_accepte: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    technicien_id: Mapped[int | None] = mapped_column(
        ForeignKey("techniciens.id", ondelete="SET NULL"), nullable=True, index=True
    )
    note_interne: Mapped[str | None] = mapped_column(Text, nullable=True)

    technicien: Mapped["Technicien | None"] = relationship(back_populates="demandes")  # noqa: F821
    prestation: Mapped["Prestation | None"] = relationship()  # noqa: F821