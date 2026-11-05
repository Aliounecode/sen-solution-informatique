from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import TypeProduit
from ..schemas.produit import (
    ImageProduitCreer,
    PageProduits,
    ProduitCreer,
    ProduitDetail,
    ProduitModifier,
    ProduitResume,
)
from ..securite import exiger_admin
from ..services import service_cloudinary, service_produit

routeur = APIRouter(prefix="/api/produits", tags=["Produits"])


@routeur.get("", response_model=PageProduits)
def liste_publique(
    session: Session = Depends(obtenir_session),
    categorie_id: int | None = None,
    type_produit: TypeProduit | None = None,
    recherche: str | None = None,
    en_vedette: bool | None = None,
    en_promo: bool | None = None,
    prix_min: int | None = Query(default=None, ge=0),
    prix_max: int | None = Query(default=None, ge=0),
    tri: str = Query(default="recent", pattern="^(recent|prix_asc|prix_desc|nom)$"),
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=12, ge=1, le=60),
):
    total, elements = service_produit.lister(
        session,
        categorie_id=categorie_id,
        type_produit=type_produit,
        recherche=recherche,
        en_vedette=en_vedette,
        en_promo=en_promo,
        prix_min=prix_min,
        prix_max=prix_max,
        tri=tri,
        page=page,
        taille=taille,
    )
    return PageProduits(total=total, page=page, taille=taille, elements=elements)


@routeur.get("/{slug}", response_model=ProduitDetail)
def detail_public(slug: str, session: Session = Depends(obtenir_session)):
    return service_produit.obtenir_par_slug(session, slug, actif_seulement=True)

@routeur.get("/{slug}/similaires", response_model=list[ProduitResume])
def produits_similaires(
    slug: str,
    session: Session = Depends(obtenir_session),
    limite: int = Query(default=4, ge=1, le=12),
):
    return service_produit.similaires(session, slug, limite)
routeur_admin = APIRouter(
    prefix="/api/admin/produits",
    tags=["Admin · Produits"],
    dependencies=[Depends(exiger_admin)],
)
@routeur_admin.post("/signature-cloudinary")
def signature_cloudinary():
    """Signature à usage unique pour téléverser une image directement vers Cloudinary."""
    return service_cloudinary.generer_signature()


@routeur_admin.get("", response_model=PageProduits)
def liste_admin(
    session: Session = Depends(obtenir_session),
    categorie_id: int | None = None,
    type_produit: TypeProduit | None = None,
    recherche: str | None = None,
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=20, ge=1, le=100),
):
    total, elements = service_produit.lister(
        session,
        categorie_id=categorie_id,
        type_produit=type_produit,
        recherche=recherche,
        page=page,
        taille=taille,
        inclure_inactifs=True,
    )
    return PageProduits(total=total, page=page, taille=taille, elements=elements)


@routeur_admin.post("", response_model=ProduitDetail, status_code=status.HTTP_201_CREATED)
def creer(donnees: ProduitCreer, session: Session = Depends(obtenir_session)):
    return service_produit.creer(session, donnees)


@routeur_admin.get("/{produit_id}", response_model=ProduitDetail)
def detail_admin(produit_id: int, session: Session = Depends(obtenir_session)):
    return service_produit.obtenir(session, produit_id)


@routeur_admin.put("/{produit_id}", response_model=ProduitDetail)
def modifier(produit_id: int, donnees: ProduitModifier, session: Session = Depends(obtenir_session)):
    return service_produit.modifier(session, produit_id, donnees)


@routeur_admin.delete("/{produit_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer(produit_id: int, session: Session = Depends(obtenir_session)):
    service_produit.supprimer(session, produit_id)


@routeur_admin.post("/{produit_id}/images", response_model=ProduitDetail, status_code=status.HTTP_201_CREATED)
def ajouter_image(produit_id: int, donnees: ImageProduitCreer, session: Session = Depends(obtenir_session)):
    return service_produit.ajouter_image(session, produit_id, donnees)


@routeur_admin.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_image(
    image_id: int,
    background: BackgroundTasks,
    session: Session = Depends(obtenir_session),
):
    public_id = service_produit.supprimer_image(session, image_id)
    if public_id:
        background.add_task(service_cloudinary.supprimer_asset, public_id)