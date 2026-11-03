from pydantic import BaseModel, ConfigDict, Field


class CategorieCreer(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    description: str | None = None
    parent_id: int | None = None
    ordre: int = 0
    actif: bool = True


class CategorieModifier(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    parent_id: int | None = None
    ordre: int | None = None
    actif: bool | None = None


class CategoriePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    slug: str
    description: str | None
    parent_id: int | None
    ordre: int
    actif: bool