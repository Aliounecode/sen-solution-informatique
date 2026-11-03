from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..modeles import Categorie, ImageProduit, Produit, TypeProduit
from ..schemas.produit import ImageProduitCreer, ProduitCreer, ProduitModifier
from ..utilitaires import slug_unique
import secrets

TRIS = {
    "recent": Produit.cree_le.desc(),
    "prix_asc": Produit.prix.asc(),
    "prix_desc": Produit.prix.desc(),
    "nom": Produit.nom.asc(),
}


def _valider_categorie(session: Session, categorie_id: int) -> None:
    if session.get(Categorie, categorie_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catégorie introuvable")


def _reference_disponible(session: Session, reference: str, exclure_id: int | None = None) -> None:
    requete = select(Produit).where(Produit.reference == reference)
    if exclure_id is not None:
        requete = requete.where(Produit.id != exclure_id)
    if session.scalar(requete) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette référence produit est déjà utilisée")

def _ids_categorie_et_descendants(session: Session, categorie_id: int) -> list[int]:
    """Renvoie l'id de la catégorie et ceux de toutes ses sous-catégories."""
    toutes = session.execute(select(Categorie.id, Categorie.parent_id)).all()
    enfants: dict[int | None, list[int]] = {}
    for cid, pid in toutes:
        enfants.setdefault(pid, []).append(cid)
    resultat: list[int] = []
    pile = [categorie_id]
    while pile:
        courant = pile.pop()
        resultat.append(courant)
        pile.extend(enfants.get(courant, []))
    return resultat

def lister(
    session: Session,
    *,
    categorie_id: int | None = None,
    type_produit: TypeProduit | None = None,
    recherche: str | None = None,
    en_vedette: bool | None = None,
    prix_min: int | None = None,
    prix_max: int | None = None,
    tri: str = "recent",
    page: int = 1,
    taille: int = 12,
    inclure_inactifs: bool = False,
) -> tuple[int, list[Produit]]:
    conditions = []
    if not inclure_inactifs:
        conditions.append(Produit.actif.is_(True))
    if categorie_id is not None:
        ids = _ids_categorie_et_descendants(session, categorie_id)
        conditions.append(Produit.categorie_id.in_(ids))
    if type_produit is not None:
        conditions.append(Produit.type_produit == type_produit)
    if en_vedette is not None:
        conditions.append(Produit.en_vedette.is_(en_vedette))
    if prix_min is not None:
        conditions.append(Produit.prix >= prix_min)
    if prix_max is not None:
        conditions.append(Produit.prix <= prix_max)
    if recherche and recherche.strip():
        motif = f"%{recherche.strip()}%"
        conditions.append(
            or_(
                Produit.nom.ilike(motif),
                Produit.marque.ilike(motif),
                Produit.modele.ilike(motif),
                Produit.reference.ilike(motif),
            )
        )

    requete = select(Produit)
    for condition in conditions:
        requete = requete.where(condition)

    total = session.scalar(select(func.count()).select_from(requete.subquery())) or 0

    requete = (
        requete.order_by(TRIS.get(tri, Produit.cree_le.desc()))
        .options(selectinload(Produit.images))
        .offset(max(page - 1, 0) * taille)
        .limit(taille)
    )
    elements = list(session.scalars(requete).all())
    return total, elements


def obtenir_par_slug(session: Session, slug: str, actif_seulement: bool = True) -> Produit:
    requete = (
        select(Produit)
        .where(Produit.slug == slug)
        .options(selectinload(Produit.images))
    )
    if actif_seulement:
        requete = requete.where(Produit.actif.is_(True))
    produit = session.scalar(requete)
    if produit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produit introuvable")
    return produit


def obtenir(session: Session, produit_id: int) -> Produit:
    requete = (
        select(Produit)
        .where(Produit.id == produit_id)
        .options(selectinload(Produit.images))
    )
    produit = session.scalar(requete)
    if produit is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Produit introuvable")
    return produit


def _reference_auto(session: Session, produit_id: int) -> str:
    base = f"SSI-{produit_id:05d}"
    reference = base
    suffixe = 2
    while session.scalar(
        select(Produit).where(Produit.reference == reference, Produit.id != produit_id)
    ) is not None:
        reference = f"{base}-{suffixe}"
        suffixe += 1
    return reference


def creer(session: Session, donnees: ProduitCreer) -> Produit:
    _valider_categorie(session, donnees.categorie_id)
    reference = (donnees.reference or "").strip()
    if reference:
        _reference_disponible(session, reference)
    produit = Produit(
        reference=reference or f"TMP-{secrets.token_hex(8)}",
        nom=donnees.nom.strip(),
        slug=slug_unique(session, Produit, donnees.nom),
        categorie_id=donnees.categorie_id,
        type_produit=donnees.type_produit,
        marque=donnees.marque,
        modele=donnees.modele,
        description=donnees.description,
        prix=donnees.prix,
        prix_promo=donnees.prix_promo,
        quantite_stock=donnees.quantite_stock,
        caracteristiques=donnees.caracteristiques or {},
        en_vedette=donnees.en_vedette,
        actif=donnees.actif,
    )
    session.add(produit)
    session.flush()
    if not reference:
        produit.reference = _reference_auto(session, produit.id)
    session.commit()
    return obtenir(session, produit.id)


def modifier(session: Session, produit_id: int, donnees: ProduitModifier) -> Produit:
    produit = obtenir(session, produit_id)
    valeurs = donnees.model_dump(exclude_unset=True)
    if "categorie_id" in valeurs and valeurs["categorie_id"] is not None:
        _valider_categorie(session, valeurs["categorie_id"])
    if "reference" in valeurs and valeurs["reference"]:
        _reference_disponible(session, valeurs["reference"].strip(), exclure_id=produit_id)
        produit.reference = valeurs["reference"].strip()
    if "nom" in valeurs and valeurs["nom"]:
        produit.nom = valeurs["nom"].strip()
        produit.slug = slug_unique(session, Produit, produit.nom, exclure_id=produit_id)
    for champ in (
        "categorie_id", "type_produit", "marque", "modele", "description",
        "prix", "prix_promo","promo_active", "quantite_stock", "caracteristiques",
        "en_vedette", "actif",
    ):
        if champ in valeurs:
            setattr(produit, champ, valeurs[champ])
    session.commit()
    return obtenir(session, produit_id)


def supprimer(session: Session, produit_id: int) -> None:
    produit = obtenir(session, produit_id)
    session.delete(produit)
    session.commit()


def ajouter_image(session: Session, produit_id: int, donnees: ImageProduitCreer) -> Produit:
    obtenir(session, produit_id)
    if donnees.est_principale:
        for image in session.scalars(
            select(ImageProduit).where(ImageProduit.produit_id == produit_id)
        ):
            image.est_principale = False
    session.add(
        ImageProduit(
            produit_id=produit_id,
            url=donnees.url,
            public_id=donnees.public_id,
            ordre=donnees.ordre,
            est_principale=donnees.est_principale,
        )
    )
    session.commit()
    return obtenir(session, produit_id)


def supprimer_image(session: Session, image_id: int) -> str | None:
    image = session.get(ImageProduit, image_id)
    if image is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image introuvable")
    public_id = image.public_id
    session.delete(image)
    session.commit()
    return public_id

def prix_effectif(produit: Produit) -> int:
    if produit.promo_active and produit.prix_promo is not None:
        return produit.prix_promo
    return produit.prix


def similaires(session: Session, slug: str, limite: int = 4) -> list[Produit]:
    source = obtenir_par_slug(session, slug)
    candidats = session.scalars(
        select(Produit)
        .where(
            Produit.actif.is_(True),
            Produit.id != source.id,
            or_(
                Produit.categorie_id == source.categorie_id,
                Produit.type_produit == source.type_produit,
            ),
        )
        .options(selectinload(Produit.images))
        .limit(200)
    ).all()
    prix_source = prix_effectif(source)

    def score(p: Produit) -> float:
        total = 0.0
        if p.categorie_id == source.categorie_id:
            total += 4
        if p.type_produit == source.type_produit:
            total += 1
        if source.marque and p.marque and p.marque.lower() == source.marque.lower():
            total += 3
        if prix_source > 0:
            rapport = prix_effectif(p) / prix_source
            if 0.7 <= rapport <= 1.3:
                total += 2
            elif 0.5 <= rapport <= 1.5:
                total += 1
        if p.quantite_stock > 0:
            total += 1
        if p.en_vedette:
            total += 0.5
        return total

    return sorted(candidats, key=score, reverse=True)[:limite]