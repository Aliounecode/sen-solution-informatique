import enum

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Horodatage


class StatutCommande(str, enum.Enum):
    nouvelle = "nouvelle"
    validee = "validee"
    refusee = "refusee"
    annulee = "annulee"


class ModeRetrait(str, enum.Enum):
    retrait_boutique = "retrait_boutique"
    livraison = "livraison"


class MoyenPaiement(str, enum.Enum):
    especes = "especes"
    orange_money = "orange_money"
    wave = "wave"
    carte = "carte"
    autre = "autre"


class Commande(Base, Horodatage):
    __tablename__ = "commandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)

    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True, index=True
    )
    nom_client: Mapped[str] = mapped_column(String(120), nullable=False)
    telephone_client: Mapped[str] = mapped_column(String(30), nullable=False)
    email_client: Mapped[str | None] = mapped_column(String(255), nullable=True)

    mode_retrait: Mapped[ModeRetrait] = mapped_column(
        Enum(ModeRetrait, name="mode_retrait"),
        default=ModeRetrait.retrait_boutique,
        nullable=False,
    )
    adresse_livraison: Mapped[str | None] = mapped_column(String(300), nullable=True)
    moyen_paiement: Mapped[MoyenPaiement | None] = mapped_column(
        Enum(MoyenPaiement, name="moyen_paiement"), nullable=True
    )

    statut: Mapped[StatutCommande] = mapped_column(
        Enum(StatutCommande, name="statut_commande"),
        default=StatutCommande.nouvelle,
        nullable=False,
        index=True,
    )
    montant_total: Mapped[int] = mapped_column(Integer, nullable=False)  # FCFA
    note_client: Mapped[str | None] = mapped_column(Text, nullable=True)
    note_interne: Mapped[str | None] = mapped_column(Text, nullable=True)

    lignes: Mapped[list["LigneCommande"]] = relationship(
        back_populates="commande",
        cascade="all, delete-orphan",
    )


class LigneCommande(Base, Horodatage):
    __tablename__ = "lignes_commande"

    id: Mapped[int] = mapped_column(primary_key=True)
    commande_id: Mapped[int] = mapped_column(
        ForeignKey("commandes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    produit_id: Mapped[int | None] = mapped_column(
        ForeignKey("produits.id", ondelete="SET NULL"), nullable=True
    )
    # Instantané des infos produit au moment de la commande
    nom_produit: Mapped[str] = mapped_column(String(200), nullable=False)
    reference_produit: Mapped[str] = mapped_column(String(60), nullable=False)
    prix_unitaire: Mapped[int] = mapped_column(Integer, nullable=False)  # FCFA
    quantite: Mapped[int] = mapped_column(Integer, nullable=False)
    sous_total: Mapped[int] = mapped_column(Integer, nullable=False)  # FCFA

    commande: Mapped["Commande"] = relationship(back_populates="lignes")