from pydantic import BaseModel, ConfigDict, Field


class TechnicienCreer(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    telephone: str | None = Field(default=None, max_length=30)
    specialite: str | None = Field(default=None, max_length=120)
    actif: bool = True


class TechnicienModifier(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=120)
    telephone: str | None = None
    specialite: str | None = None
    actif: bool | None = None


class TechnicienPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom: str
    telephone: str | None
    specialite: str | None
    actif: bool