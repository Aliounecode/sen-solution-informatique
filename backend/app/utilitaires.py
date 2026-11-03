import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session


def slugifier(valeur: str) -> str:
    """Transforme un texte en slug URL (sans accents, minuscules, tirets)."""
    valeur = unicodedata.normalize("NFKD", valeur).encode("ascii", "ignore").decode("ascii")
    valeur = re.sub(r"[^a-zA-Z0-9]+", "-", valeur).strip("-").lower()
    return valeur or "element"


def slug_unique(session: Session, modele, base: str, exclure_id: int | None = None) -> str:
    """Garantit l'unicité d'un slug pour un modèle donné (ajoute -2, -3, ...)."""
    base = slugifier(base)
    slug = base
    suffixe = 2
    while True:
        requete = select(modele).where(modele.slug == slug)
        if exclure_id is not None:
            requete = requete.where(modele.id != exclure_id)
        if session.scalar(requete) is None:
            return slug
        slug = f"{base}-{suffixe}"
        suffixe += 1