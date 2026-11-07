from pydantic import BaseModel, ConfigDict, Field


class TypeProduitCreer(BaseModel):
    libelle: str = Field(min_length=2, max_length=50)
    ordre: int = 0
    actif: bool = True


class TypeProduitModifier(BaseModel):
    libelle: str | None = Field(default=None, min_length=2, max_length=50)
    ordre: int | None = None
    actif: bool | None = None


class TypeProduitPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    libelle: str
    ordre: int
    actif: bool