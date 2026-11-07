from pydantic import BaseModel, ConfigDict, Field


class ImageProduitCreer(BaseModel):
    url: str = Field(min_length=5, max_length=500)
    public_id: str | None = Field(default=None, max_length=255)
    ordre: int = 0
    est_principale: bool = False


class ImageProduitPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    public_id: str | None
    ordre: int
    est_principale: bool


class ProduitCreer(BaseModel):
    reference: str | None = Field(default=None, max_length=60)
    nom: str = Field(min_length=2, max_length=200)
    categorie_id: int
    type_produit: str = Field(min_length=1, max_length=60)
    marque: str | None = Field(default=None, max_length=80)
    modele: str | None = Field(default=None, max_length=120)
    description: str | None = None
    prix: int = Field(ge=0)
    prix_promo: int | None = Field(default=None, ge=0)
    promo_active: bool = False
    quantite_stock: int = Field(default=0, ge=0)
    caracteristiques: dict = Field(default_factory=dict)
    en_vedette: bool = False
    actif: bool = True


class ProduitModifier(BaseModel):
    reference: str | None = Field(default=None, min_length=1, max_length=60)
    nom: str | None = Field(default=None, min_length=2, max_length=200)
    categorie_id: int | None = None
    type_produit: str | None = Field(default=None, min_length=1, max_length=60)
    marque: str | None = None
    modele: str | None = None
    description: str | None = None
    prix: int | None = Field(default=None, ge=0)
    prix_promo: int | None = Field(default=None, ge=0)
    promo_active: bool | None = None
    quantite_stock: int | None = Field(default=None, ge=0)
    caracteristiques: dict | None = None
    en_vedette: bool | None = None
    actif: bool | None = None


class ProduitResume(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    nom: str
    slug: str
    categorie_id: int
    type_produit: str
    marque: str | None
    prix: int
    prix_promo: int | None
    promo_active: bool
    quantite_stock: int
    en_vedette: bool
    actif: bool
    images: list[ImageProduitPublic] = []


class ProduitDetail(ProduitResume):
    modele: str | None
    description: str | None
    caracteristiques: dict


class PageProduits(BaseModel):
    total: int
    page: int
    taille: int
    elements: list[ProduitResume]