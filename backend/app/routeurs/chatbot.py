from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..limiteur import LimiteurDebit, limiter
from ..schemas.chatbot import ReponseChat, RequeteChat
from ..services import service_chatbot

routeur = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

_limiteur = LimiteurDebit(maximum=12, fenetre_secondes=60)


@routeur.post("", response_model=ReponseChat, dependencies=[limiter(_limiteur)])
def discuter(requete: RequeteChat, session: Session = Depends(obtenir_session)):
    return service_chatbot.repondre(session, requete)