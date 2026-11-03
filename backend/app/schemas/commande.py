from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from ..modeles import ModeRetrait, MoyenPaiement, StatutCommande


class LigneCommandeCreer(BaseModel):
    produit_id: int
    quantite: int = Field(ge=1)


class CommandeCreer(BaseModel):
    nom_client: str = Field(min_length=2, max_length=120)
    telephone_client: str = Field(min_length=6, max_length=30)
    email_client: EmailStr | None = None
    mode_retrait: ModeRetrait = ModeRetrait.retrait_boutique
    adresse_livraison: str | None = Field(default=None, max_length=300)
    moyen_paiement: MoyenPaiement | None = None
    note_client: str | None = None
    lignes: list[LigneCommandeCreer] = Field(min_length=1)

    @model_validator(mode="after")
    def _verifier_adresse(self):
        if self.mode_retrait == ModeRetrait.livraison and not (self.adresse_livraison or "").strip():
            raise ValueError("Une adresse est requise pour une livraison")
        return self


class CommandeModifierAdmin(BaseModel):
    moyen_paiement: MoyenPaiement | None = None
    note_interne: str | None = None


class ChangementStatutCommande(BaseModel):
    statut: StatutCommande


class LigneCommandePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produit_id: int | None
    nom_produit: str
    reference_produit: str
    prix_unitaire: int
    quantite: int
    sous_total: int


class CommandePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reference: str
    statut: StatutCommande
    mode_retrait: ModeRetrait
    adresse_livraison: str | None
    moyen_paiement: MoyenPaiement | None
    montant_total: int
    note_client: str | None
    lignes: list[LigneCommandePublic]
    cree_le: datetime
    modifie_le: datetime


class CommandeAdmin(CommandePublic):
    id: int
    client_id: int | None
    nom_client: str
    telephone_client: str
    email_client: str | None
    note_interne: str | None


class PageCommandes(BaseModel):
    total: int
    page: int
    taille: int
    elements: list[CommandeAdmin]