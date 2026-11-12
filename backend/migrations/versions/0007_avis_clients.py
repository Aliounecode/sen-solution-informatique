"""avis clients (produits ou site) avec modération

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "avis",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("produit_id", sa.Integer(), sa.ForeignKey("produits.id", ondelete="CASCADE"), nullable=True),
        sa.Column("utilisateur_id", sa.Integer(), sa.ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("nom_affiche", sa.String(length=80), nullable=False),
        sa.Column("note", sa.Integer(), nullable=False),
        sa.Column("commentaire", sa.Text(), nullable=False),
        sa.Column("statut", sa.String(length=20), server_default="en_attente", nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("note BETWEEN 1 AND 5", name="ck_avis_note"),
    )
    op.create_index("ix_avis_produit_id", "avis", ["produit_id"])
    op.create_index("ix_avis_utilisateur_id", "avis", ["utilisateur_id"])
    op.create_index("ix_avis_statut", "avis", ["statut"])


def downgrade() -> None:
    op.drop_index("ix_avis_statut", table_name="avis")
    op.drop_index("ix_avis_utilisateur_id", table_name="avis")
    op.drop_index("ix_avis_produit_id", table_name="avis")
    op.drop_table("avis")
