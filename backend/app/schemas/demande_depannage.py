from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..modeles import StatutDemande
from .prestation import PrestationPublic
from .technicien import TechnicienPublic


class DemandeCreer(BaseModel):
    nom_client: str = Field(min_length=2, max_length=120)
    telephone_client: str = Field(min_length=6, max_length=30)
    email_client: EmailStr | None = None
    type_appareil: str = Field(min_length=2, max_length=120)
    marque_appareil: str | None = Field(default=None, max_length=80)
    modele_appareil: str | None = Field(default=None, max_length=120)
    description_panne: str = Field(min_length=5)
    prestation_id: int | None = None


class DemandeModifierAdmin(BaseModel):
    nom_client: str | None = Field(default=None, min_length=2, max_length=120)
    telephone_client: str | None = Field(default=None, min_length=6, max_length=30)
    email_client: EmailStr | None = None
    type_appareil: str | None = Field(default=None, min_length=2, max_length=120)
    marque_appareil: str | None = None
    modele_appareil: str | None = None
    description_panne: str | None = Field(default=None, min_length=5)
    prestation_id: int | None = None
    diagnostic: str | None = None
    montant_devis: int | None = Field(default=None, ge=0)
    technicien_id: int | None = None
    note_interne: str | None = None


class ChangementStatut(BaseModel):
    statut: StatutDemande


class ReponseDevis(BaseModel):
    accepte: bool


class DemandePublic(BaseModel):
    """Vue de suivi côté client (sans notes internes)."""

    model_config = ConfigDict(from_attributes=True)

    reference: str
    statut: StatutDemande
    type_appareil: str
    marque_appareil: str | None
    modele_appareil: str | None
    description_panne: str
    diagnostic: str | None
    montant_devis: int | None
    devis_accepte: bool | None
    prestation: PrestationPublic | None
    cree_le: datetime
    modifie_le: datetime


class DemandeAdmin(DemandePublic):
    """Vue complète côté admin."""

    id: int
    client_id: int | None
    nom_client: str
    telephone_client: str
    email_client: str | None
    note_interne: str | None
    technicien: TechnicienPublic | None


class PageDemandes(BaseModel):
    total: int
    page: int
    taille: int
    elements: list[DemandeAdmin]