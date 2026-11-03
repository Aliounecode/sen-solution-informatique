from pydantic import BaseModel, ConfigDict, Field


class PrestationCreer(BaseModel):
    nom: str = Field(min_length=2, max_length=150)
    description: str | None = None
    tarif: int | None = Field(default=None, ge=0)  # None = sur devis
    duree_estimee: str | None = Field(default=None, max_length=80)
    ordre: int = 0
    actif: bool = True


class PrestationModifier(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = None
    tarif: int | None = Field(default=None, ge=0)
    duree_estimee: str | None = None
    ordre: int | None = None
    actif: bool | None = None


class PrestationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    slug: str
    description: str | None
    tarif: int | None
    duree_estimee: str | None
    ordre: int
    actif: bool