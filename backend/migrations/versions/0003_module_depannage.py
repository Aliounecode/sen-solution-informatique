"""module depannage : prestations, techniciens, demandes

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prestations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=170), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tarif", sa.Integer(), nullable=True),
        sa.Column("duree_estimee", sa.String(length=80), nullable=True),
        sa.Column("ordre", sa.Integer(), server_default="0", nullable=False),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_prestations_slug", "prestations", ["slug"], unique=True)

    op.create_table(
        "techniciens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.Column("telephone", sa.String(length=30), nullable=True),
        sa.Column("specialite", sa.String(length=120), nullable=True),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "demandes_depannage",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(length=30), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("nom_client", sa.String(length=120), nullable=False),
        sa.Column("telephone_client", sa.String(length=30), nullable=False),
        sa.Column("email_client", sa.String(length=255), nullable=True),
        sa.Column("type_appareil", sa.String(length=120), nullable=False),
        sa.Column("marque_appareil", sa.String(length=80), nullable=True),
        sa.Column("modele_appareil", sa.String(length=120), nullable=True),
        sa.Column("description_panne", sa.Text(), nullable=False),
        sa.Column("prestation_id", sa.Integer(), nullable=True),
        sa.Column(
            "statut",
            sa.Enum(
                "recue", "diagnostic", "devis", "en_reparation", "prete", "livree", "annulee",
                name="statut_demande",
            ),
            server_default="recue",
            nullable=False,
        ),
        sa.Column("diagnostic", sa.Text(), nullable=True),
        sa.Column("montant_devis", sa.Integer(), nullable=True),
        sa.Column("devis_accepte", sa.Boolean(), nullable=True),
        sa.Column("technicien_id", sa.Integer(), nullable=True),
        sa.Column("note_interne", sa.Text(), nullable=True),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["utilisateurs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["prestation_id"], ["prestations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["technicien_id"], ["techniciens.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_demandes_depannage_reference", "demandes_depannage", ["reference"], unique=True)
    op.create_index("ix_demandes_depannage_client_id", "demandes_depannage", ["client_id"])
    op.create_index("ix_demandes_depannage_statut", "demandes_depannage", ["statut"])
    op.create_index("ix_demandes_depannage_technicien_id", "demandes_depannage", ["technicien_id"])


def downgrade() -> None:
    op.drop_index("ix_demandes_depannage_technicien_id", table_name="demandes_depannage")
    op.drop_index("ix_demandes_depannage_statut", table_name="demandes_depannage")
    op.drop_index("ix_demandes_depannage_client_id", table_name="demandes_depannage")
    op.drop_index("ix_demandes_depannage_reference", table_name="demandes_depannage")
    op.drop_table("demandes_depannage")
    op.drop_table("techniciens")
    op.drop_index("ix_prestations_slug", table_name="prestations")
    op.drop_table("prestations")
    sa.Enum(name="statut_demande").drop(op.get_bind(), checkfirst=True)