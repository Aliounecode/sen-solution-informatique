from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..modeles import RoleUtilisateur


class UtilisateurCreer(BaseModel):
    nom_complet: str = Field(min_length=2, max_length=120)
    email: EmailStr
    telephone: str | None = Field(default=None, max_length=30)
    mot_de_passe: str = Field(min_length=8, max_length=72)


class UtilisateurConnexion(BaseModel):
    email: EmailStr
    mot_de_passe: str


class UtilisateurPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom_complet: str
    email: EmailStr
    telephone: str | None
    role: RoleUtilisateur
    actif: bool
    cree_le: datetime


# ----- Administration des comptes -----
class UtilisateurCreerAdmin(BaseModel):
    nom_complet: str = Field(min_length=2, max_length=120)
    email: EmailStr
    telephone: str | None = Field(default=None, max_length=30)
    mot_de_passe: str = Field(min_length=8, max_length=72)
    role: RoleUtilisateur = RoleUtilisateur.client


class UtilisateurModifierAdmin(BaseModel):
    nom_complet: str | None = Field(default=None, min_length=2, max_length=120)
    telephone: str | None = None
    role: RoleUtilisateur | None = None
    actif: bool | None = None


class ReinitialiserMotDePasse(BaseModel):
    nouveau_mot_de_passe: str = Field(min_length=8, max_length=72)


class PageUtilisateurs(BaseModel):
    total: int
    page: int
    taille: int
    elements: list[UtilisateurPublic]