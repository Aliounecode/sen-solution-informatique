"""creation table utilisateurs

Revision ID: 0001
Revises:
Create Date: 2026-09-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "utilisateurs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_complet", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telephone", sa.String(length=30), nullable=True),
        sa.Column("mot_de_passe_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("client", "admin", name="role_utilisateur"),
            server_default="client",
            nullable=False,
        ),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_utilisateurs_email", "utilisateurs", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_utilisateurs_email", table_name="utilisateurs")
    op.drop_table("utilisateurs")
    sa.Enum(name="role_utilisateur").drop(op.get_bind(), checkfirst=True)
