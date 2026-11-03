import time

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException, status

from ..configuration import parametres


def _configurer() -> bool:
    """Configure le SDK si les identifiants sont présents. Renvoie False sinon."""
    if not (
        parametres.CLOUDINARY_CLOUD_NAME
        and parametres.CLOUDINARY_API_KEY
        and parametres.CLOUDINARY_API_SECRET
    ):
        return False
    cloudinary.config(
        cloud_name=parametres.CLOUDINARY_CLOUD_NAME,
        api_key=parametres.CLOUDINARY_API_KEY,
        api_secret=parametres.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return True


def generer_signature() -> dict:
    """Signature pour un téléversement direct navigateur → Cloudinary."""
    if not _configurer():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Cloudinary n'est pas configuré sur le serveur.",
        )
    horodatage = int(time.time())
    a_signer = {"timestamp": horodatage, "folder": parametres.CLOUDINARY_DOSSIER}
    signature = cloudinary.utils.api_sign_request(a_signer, parametres.CLOUDINARY_API_SECRET)
    return {
        "timestamp": horodatage,
        "signature": signature,
        "api_key": parametres.CLOUDINARY_API_KEY,
        "cloud_name": parametres.CLOUDINARY_CLOUD_NAME,
        "dossier": parametres.CLOUDINARY_DOSSIER,
    }


def supprimer_asset(public_id: str) -> None:
    """Supprime l'image sur Cloudinary (best-effort, ne lève jamais)."""
    if not public_id or not _configurer():
        return
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass