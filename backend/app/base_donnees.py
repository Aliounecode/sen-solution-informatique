from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .configuration import parametres

moteur = create_engine(parametres.URL_BASE_DONNEES, pool_pre_ping=True)
SessionLocale = sessionmaker(bind=moteur, autoflush=False, autocommit=False)


def obtenir_session():
    session = SessionLocale()
    try:
        yield session
    finally:
        session.close()
