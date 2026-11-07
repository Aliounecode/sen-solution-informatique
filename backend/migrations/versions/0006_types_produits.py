"""types de produits extensibles + caractéristiques réservées à certains types

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    types = op.create_table(
        "types_produits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=60), nullable=False),
        sa.Column("libelle", sa.String(length=60), nullable=False),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_types_produits_slug", "types_produits", ["slug"], unique=True)
    op.bulk_insert(
        types,
        [
            {"slug": "ordinateur", "libelle": "Ordinateurs", "ordre": 1},
            {"slug": "accessoire", "libelle": "Accessoires", "ordre": 2},
            {"slug": "console", "libelle": "Consoles & jeux vidéo", "ordre": 3},
        ],
    )

    # La colonne passe d'un ENUM PostgreSQL figé à un texte libre (le slug du type)
    op.execute(
        "ALTER TABLE produits ALTER COLUMN type_produit TYPE VARCHAR(60) USING type_produit::text"
    )
    op.execute("DROP TYPE IF EXISTS type_produit")
    op.create_index("ix_produits_type_produit", "produits", ["type_produit"])

    # Types concernés par une caractéristique (NULL = tous les types)
    op.add_column(
        "definitions_specifications",
        sa.Column("types", postgresql.JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("definitions_specifications", "types")
    op.drop_index("ix_produits_type_produit", table_name="produits")
    op.execute(
        "UPDATE produits SET type_produit = 'accessoire' "
        "WHERE type_produit NOT IN ('ordinateur', 'accessoire')"
    )
    op.execute("CREATE TYPE type_produit AS ENUM ('ordinateur', 'accessoire')")
    op.execute(
        "ALTER TABLE produits ALTER COLUMN type_produit "
        "TYPE type_produit USING type_produit::type_produit"
    )
    op.drop_index("ix_types_produits_slug", table_name="types_produits")
    op.drop_table("types_produits")