"""commandes en ligne : commandes + lignes

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "commandes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(length=30), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("nom_client", sa.String(length=120), nullable=False),
        sa.Column("telephone_client", sa.String(length=30), nullable=False),
        sa.Column("email_client", sa.String(length=255), nullable=True),
        sa.Column(
            "mode_retrait",
            sa.Enum("retrait_boutique", "livraison", name="mode_retrait"),
            server_default="retrait_boutique",
            nullable=False,
        ),
        sa.Column("adresse_livraison", sa.String(length=300), nullable=True),
        sa.Column(
            "moyen_paiement",
            sa.Enum("especes", "orange_money", "wave", "carte", "autre", name="moyen_paiement"),
            nullable=True,
        ),
        sa.Column(
            "statut",
            sa.Enum("nouvelle", "validee", "refusee", "annulee", name="statut_commande"),
            server_default="nouvelle",
            nullable=False,
        ),
        sa.Column("montant_total", sa.Integer(), nullable=False),
        sa.Column("note_client", sa.Text(), nullable=True),
        sa.Column("note_interne", sa.Text(), nullable=True),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["utilisateurs.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_commandes_reference", "commandes", ["reference"], unique=True)
    op.create_index("ix_commandes_client_id", "commandes", ["client_id"])
    op.create_index("ix_commandes_statut", "commandes", ["statut"])

    op.create_table(
        "lignes_commande",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("commande_id", sa.Integer(), nullable=False),
        sa.Column("produit_id", sa.Integer(), nullable=True),
        sa.Column("nom_produit", sa.String(length=200), nullable=False),
        sa.Column("reference_produit", sa.String(length=60), nullable=False),
        sa.Column("prix_unitaire", sa.Integer(), nullable=False),
        sa.Column("quantite", sa.Integer(), nullable=False),
        sa.Column("sous_total", sa.Integer(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_lignes_commande_commande_id", "lignes_commande", ["commande_id"])


def downgrade() -> None:
    op.drop_index("ix_lignes_commande_commande_id", table_name="lignes_commande")
    op.drop_table("lignes_commande")
    op.drop_index("ix_commandes_statut", table_name="commandes")
    op.drop_index("ix_commandes_client_id", table_name="commandes")
    op.drop_index("ix_commandes_reference", table_name="commandes")
    op.drop_table("commandes")
    bind = op.get_bind()
    sa.Enum(name="statut_commande").drop(bind, checkfirst=True)
    sa.Enum(name="moyen_paiement").drop(bind, checkfirst=True)
    sa.Enum(name="mode_retrait").drop(bind, checkfirst=True)