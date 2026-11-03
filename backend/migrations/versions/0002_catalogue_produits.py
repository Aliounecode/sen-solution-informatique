"""catalogue produits : categories, specifications, produits, images

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# JSONB sous PostgreSQL, JSON portable ailleurs
JSON_VARIANT = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    op.create_table(
        "definitions_specifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cle", sa.String(length=60), nullable=False),
        sa.Column("libelle", sa.String(length=120), nullable=False),
        sa.Column("groupe", sa.String(length=80), nullable=True),
        sa.Column(
            "type_valeur",
            sa.Enum("texte", "nombre", "booleen", "liste", name="type_valeur_specification"),
            server_default="texte",
            nullable=False,
        ),
        sa.Column("unite", sa.String(length=20), nullable=True),
        sa.Column("options", JSON_VARIANT, nullable=True),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_definitions_specifications_cle", "definitions_specifications", ["cle"], unique=True
    )

    op.create_table(
        "produits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(length=60), nullable=False),
        sa.Column("nom", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("categorie_id", sa.Integer(), nullable=False),
        sa.Column(
            "type_produit",
            sa.Enum("ordinateur", "accessoire", name="type_produit"),
            nullable=False,
        ),
        sa.Column("marque", sa.String(length=80), nullable=True),
        sa.Column("modele", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("prix", sa.Integer(), nullable=False),
        sa.Column("prix_promo", sa.Integer(), nullable=True),
        sa.Column("quantite_stock", sa.Integer(), server_default="0", nullable=False),
        sa.Column("caracteristiques", JSON_VARIANT, server_default=sa.text("'{}'"), nullable=False),
        sa.Column("en_vedette", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["categorie_id"], ["categories.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_produits_reference", "produits", ["reference"], unique=True)
    op.create_index("ix_produits_slug", "produits", ["slug"], unique=True)
    op.create_index("ix_produits_categorie_id", "produits", ["categorie_id"])

    op.create_table(
        "images_produit",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("produit_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("public_id", sa.String(length=255), nullable=True),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("est_principale", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["produit_id"], ["produits.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_images_produit_produit_id", "images_produit", ["produit_id"])


def downgrade() -> None:
    op.drop_index("ix_images_produit_produit_id", table_name="images_produit")
    op.drop_table("images_produit")
    op.drop_index("ix_produits_categorie_id", table_name="produits")
    op.drop_index("ix_produits_slug", table_name="produits")
    op.drop_index("ix_produits_reference", table_name="produits")
    op.drop_table("produits")
    op.drop_index("ix_definitions_specifications_cle", table_name="definitions_specifications")
    op.drop_table("definitions_specifications")
    op.drop_index("ix_categories_slug", table_name="categories")
    op.drop_table("categories")
    bind = op.get_bind()
    sa.Enum(name="type_produit").drop(bind, checkfirst=True)
    sa.Enum(name="type_valeur_specification").drop(bind, checkfirst=True)