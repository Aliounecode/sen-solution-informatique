from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

StatutAvis = Literal["en_attente", "publie", "refuse"]


class AvisCreer(BaseModel):
    """Avis déposé par un client connecté (publié après validation de l'admin)."""

    produit_id: int | None = None  # None = avis sur le site / la boutique
    note: int = Field(ge=1, le=5)
    commentaire: str = Field(min_length=5, max_length=1000)
    nom_affiche: str | None = Field(default=None, min_length=2, max_length=80)


class AvisAdminCreer(BaseModel):
    """Avis saisi par l'admin (ex. témoignage reçu par WhatsApp) : publié directement."""

    produit_id: int | None = None
    nom_affiche: str = Field(min_length=2, max_length=80)
    note: int = Field(ge=1, le=5)
    commentaire: str = Field(min_length=5, max_length=1000)
    statut: StatutAvis = "publie"


class AvisModifier(BaseModel):
    nom_affiche: str | None = Field(default=None, min_length=2, max_length=80)
    note: int | None = Field(default=None, ge=1, le=5)
    commentaire: str | None = Field(default=None, min_length=5, max_length=1000)
    statut: StatutAvis | None = None


class AvisPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom_affiche: str
    note: int
    commentaire: str
    produit_id: int | None
    produit_nom: str | None
    produit_slug: str | None
    cree_le: datetime


class AvisAdmin(AvisPublic):
    statut: StatutAvis
    utilisateur_id: int | None


class PageAvis(BaseModel):
    moyenne: float | None
    total: int
    elements: list[AvisPublic]


class PageAvisAdmin(BaseModel):
    total: int
    en_attente: int
    page: int
    taille: int
    elements: list[AvisAdmin]
