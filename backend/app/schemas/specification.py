from pydantic import BaseModel, ConfigDict, Field

from ..modeles import TypeValeur


class SpecificationCreer(BaseModel):
    cle: str = Field(min_length=1, max_length=60)
    libelle: str = Field(min_length=1, max_length=120)
    groupe: str | None = Field(default=None, max_length=80)
    type_valeur: TypeValeur = TypeValeur.texte
    unite: str | None = Field(default=None, max_length=20)
    options: list[str] | None = None
    types: list[str] | None = None  # slugs de types ; vide = tous
    ordre: int = 0
    actif: bool = True


class SpecificationModifier(BaseModel):
    libelle: str | None = Field(default=None, min_length=1, max_length=120)
    groupe: str | None = None
    type_valeur: TypeValeur | None = None
    unite: str | None = None
    options: list[str] | None = None
    types: list[str] | None = None
    ordre: int | None = None
    actif: bool | None = None


class SpecificationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cle: str
    libelle: str
    groupe: str | None
    type_valeur: TypeValeur
    unite: str | None
    options: list[str] | None
    types: list[str] | None
    ordre: int
    actif: bool