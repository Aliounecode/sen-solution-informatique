from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..schemas.statistiques import StatistiquesResume
from ..securite import exiger_admin
from ..services import service_statistiques

routeur_admin = APIRouter(
    prefix="/api/admin/statistiques",
    tags=["Admin · Statistiques"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=StatistiquesResume)
def resume(session: Session = Depends(obtenir_session)):
    return service_statistiques.resume(session)