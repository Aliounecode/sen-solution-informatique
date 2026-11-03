"""Générateur du squelette backend — Sen Solution Informatique.

Usage : python generer_backend.py

Crée le dossier backend/ complet : les fichiers de la Phase 0 sont déjà
remplis (auth, sécurité, config, migration 0001), les autres sont des
placeholders vides que l'on remplira ensemble, phase par phase.

Le script N'ÉCRASE JAMAIS un fichier existant : tu peux le relancer sans
risque de perdre ton travail (les fichiers déjà présents sont ignorés).
"""
from pathlib import Path

RACINE = Path(__file__).resolve().parent / "backend"

DOSSIERS = [
    '',
    'app',
    'app/modeles',
    'app/schemas',
    'app/services',
    'app/routeurs',
    'migrations',
    'migrations/versions',
]

# chemin relatif -> contenu ('' = fichier vide, à remplir plus tard)
FICHIERS = {
    'requirements.txt': r'''fastapi
uvicorn[standard]
sqlalchemy>=2.0
alembic
psycopg[binary]>=3.1
pydantic[email]>=2
pydantic-settings>=2
pyjwt>=2.8
bcrypt>=4.1
''',
    '.env.example': r'''URL_BASE_DONNEES=postgresql+psycopg://postgres:motdepasse@localhost:5432/sen_solution
CLE_SECRETE=change-moi-avec-une-cle-longue-et-aleatoire
ALGORITHME=HS256
DUREE_TOKEN_ACCES_MINUTES=30
DUREE_TOKEN_RAFRAICHISSEMENT_JOURS=7
ORIGINES_CORS=http://localhost:4200
''',
    '.gitignore': r'''venv/
__pycache__/
*.pyc
.env
*.db
''',
    'alembic.ini': r'''[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARNING
handlers = console
qualname =

[logger_sqlalchemy]
level = WARNING
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
''',
    'creer_admin.py': r'''"""Création d'un compte administrateur.

Usage (venv activé, depuis backend/) :
    python creer_admin.py
"""
from getpass import getpass

from app.base_donnees import SessionLocale
from app.modeles import RoleUtilisateur, Utilisateur
from app.securite import hacher_mot_de_passe
from app.services.service_utilisateur import obtenir_par_email


def principal():
    session = SessionLocale()
    try:
        email = input("E-mail admin : ").strip().lower()
        if obtenir_par_email(session, email):
            print("Un compte existe déjà avec cet e-mail.")
            return
        nom = input("Nom complet : ").strip()
        mot_de_passe = getpass("Mot de passe : ")
        admin = Utilisateur(
            nom_complet=nom,
            email=email,
            mot_de_passe_hash=hacher_mot_de_passe(mot_de_passe),
            role=RoleUtilisateur.admin,
        )
        session.add(admin)
        session.commit()
        print(f"Administrateur créé : {email}")
    finally:
        session.close()


if __name__ == "__main__":
    principal()
''',
    'app/__init__.py': r'''''',
    'app/configuration.py': r'''from pydantic_settings import BaseSettings, SettingsConfigDict


class Parametres(BaseSettings):
    URL_BASE_DONNEES: str
    CLE_SECRETE: str
    ALGORITHME: str = "HS256"
    DUREE_TOKEN_ACCES_MINUTES: int = 30
    DUREE_TOKEN_RAFRAICHISSEMENT_JOURS: int = 7
    ORIGINES_CORS: str = "http://localhost:4200"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def liste_origines_cors(self) -> list[str]:
        return [o.strip() for o in self.ORIGINES_CORS.split(",") if o.strip()]


parametres = Parametres()
''',
    'app/base_donnees.py': r'''from sqlalchemy import create_engine
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
''',
    'app/securite.py': r'''from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .base_donnees import obtenir_session
from .configuration import parametres
from .modeles import RoleUtilisateur, Utilisateur

schema_bearer = HTTPBearer()

TYPE_ACCES = "acces"
TYPE_RAFRAICHISSEMENT = "rafraichissement"


def hacher_mot_de_passe(mot_de_passe: str) -> str:
    hache = bcrypt.hashpw(mot_de_passe.encode("utf-8"), bcrypt.gensalt())
    return hache.decode("utf-8")


def verifier_mot_de_passe(mot_de_passe: str, hache: str) -> bool:
    return bcrypt.checkpw(mot_de_passe.encode("utf-8"), hache.encode("utf-8"))


def _creer_token(sujet: int, type_token: str, duree: timedelta) -> str:
    maintenant = datetime.now(timezone.utc)
    charge = {
        "sub": str(sujet),
        "type": type_token,
        "iat": maintenant,
        "exp": maintenant + duree,
    }
    return jwt.encode(charge, parametres.CLE_SECRETE, algorithm=parametres.ALGORITHME)


def creer_token_acces(id_utilisateur: int) -> str:
    return _creer_token(
        id_utilisateur, TYPE_ACCES,
        timedelta(minutes=parametres.DUREE_TOKEN_ACCES_MINUTES),
    )


def creer_token_rafraichissement(id_utilisateur: int) -> str:
    return _creer_token(
        id_utilisateur, TYPE_RAFRAICHISSEMENT,
        timedelta(days=parametres.DUREE_TOKEN_RAFRAICHISSEMENT_JOURS),
    )


def decoder_token(token: str) -> dict:
    try:
        return jwt.decode(token, parametres.CLE_SECRETE, algorithms=[parametres.ALGORITHME])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton invalide ou expiré",
        )


def utilisateur_courant(
    identifiants: HTTPAuthorizationCredentials = Depends(schema_bearer),
    session: Session = Depends(obtenir_session),
) -> Utilisateur:
    charge = decoder_token(identifiants.credentials)
    if charge.get("type") != TYPE_ACCES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Type de jeton incorrect")
    identifiant = charge.get("sub")
    utilisateur = session.get(Utilisateur, int(identifiant)) if identifiant else None
    if utilisateur is None or not utilisateur.actif:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur introuvable ou désactivé")
    return utilisateur


def exiger_admin(utilisateur: Utilisateur = Depends(utilisateur_courant)) -> Utilisateur:
    if utilisateur.role != RoleUtilisateur.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès réservé à l'administrateur")
    return utilisateur
''',
    'app/main.py': r'''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .configuration import parametres
from .routeurs import authentification

application = FastAPI(title="Sen Solution Informatique — API", version="0.1.0")

application.add_middleware(
    CORSMiddleware,
    allow_origins=parametres.liste_origines_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

application.include_router(authentification.routeur)


@application.get("/api/sante", tags=["Système"])
def sante():
    return {"statut": "ok"}
''',
    'app/modeles/__init__.py': r'''from .base import Base
from .utilisateur import RoleUtilisateur, Utilisateur

__all__ = ["Base", "Utilisateur", "RoleUtilisateur"]
''',
    'app/modeles/base.py': r'''from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Horodatage:
    """Colonnes de traçabilité communes à toutes les tables."""

    cree_le: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    modifie_le: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
''',
    'app/modeles/utilisateur.py': r'''import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, Horodatage


class RoleUtilisateur(str, enum.Enum):
    client = "client"
    admin = "admin"


class Utilisateur(Base, Horodatage):
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom_complet: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    mot_de_passe_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleUtilisateur] = mapped_column(
        Enum(RoleUtilisateur, name="role_utilisateur"),
        default=RoleUtilisateur.client,
        nullable=False,
    )
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
''',
    'app/schemas/__init__.py': r'''''',
    'app/schemas/authentification.py': r'''from pydantic import BaseModel


class Jeton(BaseModel):
    token_acces: str
    token_rafraichissement: str
    type_jeton: str = "bearer"


class RafraichirRequete(BaseModel):
    token_rafraichissement: str
''',
    'app/schemas/utilisateur.py': r'''from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..modeles import RoleUtilisateur


class UtilisateurCreer(BaseModel):
    nom_complet: str = Field(min_length=2, max_length=120)
    email: EmailStr
    telephone: str | None = Field(default=None, max_length=30)
    mot_de_passe: str = Field(min_length=8, max_length=72)


class UtilisateurConnexion(BaseModel):
    email: EmailStr
    mot_de_passe: str


class UtilisateurPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nom_complet: str
    email: EmailStr
    telephone: str | None
    role: RoleUtilisateur
    actif: bool
    cree_le: datetime
''',
    'app/services/__init__.py': r'''''',
    'app/services/service_authentification.py': r'''from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..modeles import RoleUtilisateur, Utilisateur
from ..schemas.utilisateur import UtilisateurCreer
from ..securite import hacher_mot_de_passe, verifier_mot_de_passe
from .service_utilisateur import obtenir_par_email


def inscrire(session: Session, donnees: UtilisateurCreer) -> Utilisateur:
    if obtenir_par_email(session, donnees.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Un compte existe déjà avec cet e-mail")
    utilisateur = Utilisateur(
        nom_complet=donnees.nom_complet.strip(),
        email=donnees.email.lower(),
        telephone=donnees.telephone,
        mot_de_passe_hash=hacher_mot_de_passe(donnees.mot_de_passe),
        role=RoleUtilisateur.client,
    )
    session.add(utilisateur)
    session.commit()
    session.refresh(utilisateur)
    return utilisateur


def authentifier(session: Session, email: str, mot_de_passe: str) -> Utilisateur:
    utilisateur = obtenir_par_email(session, email)
    if not utilisateur or not verifier_mot_de_passe(mot_de_passe, utilisateur.mot_de_passe_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail ou mot de passe incorrect")
    if not utilisateur.actif:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Compte désactivé")
    return utilisateur
''',
    'app/services/service_utilisateur.py': r'''from sqlalchemy import select
from sqlalchemy.orm import Session

from ..modeles import Utilisateur


def obtenir_par_email(session: Session, email: str) -> Utilisateur | None:
    return session.scalar(select(Utilisateur).where(Utilisateur.email == email.lower()))
''',
    'app/routeurs/__init__.py': r'''''',
    'app/routeurs/authentification.py': r'''from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import Utilisateur
from ..schemas.authentification import Jeton, RafraichirRequete
from ..schemas.utilisateur import UtilisateurConnexion, UtilisateurCreer, UtilisateurPublic
from ..securite import (
    TYPE_RAFRAICHISSEMENT,
    creer_token_acces,
    creer_token_rafraichissement,
    decoder_token,
    utilisateur_courant,
)
from ..services import service_authentification

routeur = APIRouter(prefix="/api/auth", tags=["Authentification"])


@routeur.post("/inscription", response_model=UtilisateurPublic, status_code=status.HTTP_201_CREATED)
def inscription(donnees: UtilisateurCreer, session: Session = Depends(obtenir_session)):
    return service_authentification.inscrire(session, donnees)


@routeur.post("/connexion", response_model=Jeton)
def connexion(donnees: UtilisateurConnexion, session: Session = Depends(obtenir_session)):
    utilisateur = service_authentification.authentifier(session, donnees.email, donnees.mot_de_passe)
    return Jeton(
        token_acces=creer_token_acces(utilisateur.id),
        token_rafraichissement=creer_token_rafraichissement(utilisateur.id),
    )


@routeur.post("/rafraichir", response_model=Jeton)
def rafraichir(donnees: RafraichirRequete, session: Session = Depends(obtenir_session)):
    charge = decoder_token(donnees.token_rafraichissement)
    if charge.get("type") != TYPE_RAFRAICHISSEMENT:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Jeton de rafraîchissement attendu")
    utilisateur = session.get(Utilisateur, int(charge["sub"]))
    if not utilisateur or not utilisateur.actif:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Utilisateur invalide")
    return Jeton(
        token_acces=creer_token_acces(utilisateur.id),
        token_rafraichissement=creer_token_rafraichissement(utilisateur.id),
    )


@routeur.get("/moi", response_model=UtilisateurPublic)
def moi(utilisateur: Utilisateur = Depends(utilisateur_courant)):
    return utilisateur
''',
    'migrations/env.py': r'''from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.configuration import parametres
from app.modeles import Base  # importe et enregistre toutes les tables

config = context.config
config.set_main_option("sqlalchemy.url", parametres.URL_BASE_DONNEES)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
''',
    'migrations/script.py.mako': r'''"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
''',
    'migrations/versions/0001_creation_table_utilisateurs.py': r'''"""creation table utilisateurs

Revision ID: 0001
Revises:
Create Date: 2026-09-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "utilisateurs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nom_complet", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("telephone", sa.String(length=30), nullable=True),
        sa.Column("mot_de_passe_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("client", "admin", name="role_utilisateur"),
            server_default="client",
            nullable=False,
        ),
        sa.Column("actif", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("cree_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("modifie_le", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_utilisateurs_email", "utilisateurs", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_utilisateurs_email", table_name="utilisateurs")
    op.drop_table("utilisateurs")
    sa.Enum(name="role_utilisateur").drop(op.get_bind(), checkfirst=True)
''',
    'app/modeles/categorie.py': '',
    'app/modeles/produit.py': '',
    'app/modeles/service_depannage.py': '',
    'app/modeles/commande.py': '',
    'app/schemas/categorie.py': '',
    'app/schemas/produit.py': '',
    'app/schemas/service_depannage.py': '',
    'app/schemas/commande.py': '',
    'app/services/service_categorie.py': '',
    'app/services/service_produit.py': '',
    'app/services/service_depannage.py': '',
    'app/services/service_commande.py': '',
    'app/routeurs/utilisateurs.py': '',
    'app/routeurs/categories.py': '',
    'app/routeurs/produits.py': '',
    'app/routeurs/services_depannage.py': '',
    'app/routeurs/commandes.py': '',
}


def principal() -> None:
    for dossier in DOSSIERS:
        (RACINE / dossier).mkdir(parents=True, exist_ok=True)
    crees, existants = [], []
    for chemin, contenu in FICHIERS.items():
        cible = RACINE / chemin
        cible.parent.mkdir(parents=True, exist_ok=True)
        if cible.exists():
            existants.append(chemin)
            continue
        cible.write_text(contenu, encoding="utf-8")
        crees.append(chemin)
    print(f"\nBackend généré dans : {RACINE}\n")
    print(f"{len(crees)} fichier(s) créé(s) :")
    for chemin in sorted(crees):
        marque = "   (vide)" if FICHIERS[chemin] == "" else ""
        print(f"  + backend/{chemin}{marque}")
    if existants:
        print(f"\n{len(existants)} déjà présent(s), ignoré(s) :")
        for chemin in sorted(existants):
            print(f"  = backend/{chemin}")
    print("\nÉtape suivante : venv + pip install -r backend/requirements.txt,")
    print("puis on remplit les placeholders ensemble.")


if __name__ == "__main__":
    principal()
