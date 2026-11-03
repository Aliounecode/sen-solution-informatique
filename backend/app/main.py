from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .configuration import parametres
from .routeurs import (
    authentification,
    categories,
    commandes,
    demandes_depannage,
    prestations,
    produits,
    specifications,
    statistiques,
    techniciens,
    utilisateurs,
    chatbot,
)

application = FastAPI(title="Sen Solution Informatique — API", version="0.1.0")

application.add_middleware(
    CORSMiddleware,
    allow_origins=parametres.liste_origines_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentification
application.include_router(authentification.routeur)

# Catalogue — accès public
application.include_router(categories.routeur)
application.include_router(specifications.routeur)
application.include_router(produits.routeur)

# Services de dépannage — accès public / client
application.include_router(prestations.routeur)
application.include_router(demandes_depannage.routeur)

# Commandes — accès public / client
application.include_router(commandes.routeur)
application.include_router(chatbot.routeur)

# Espace client connecté (demandes + commandes)
application.include_router(demandes_depannage.routeur_compte)
application.include_router(commandes.routeur_compte)

# Administration
application.include_router(categories.routeur_admin)
application.include_router(specifications.routeur_admin)
application.include_router(produits.routeur_admin)
application.include_router(prestations.routeur_admin)
application.include_router(techniciens.routeur_admin)
application.include_router(demandes_depannage.routeur_admin)
application.include_router(commandes.routeur_admin)
application.include_router(utilisateurs.routeur_admin)
application.include_router(statistiques.routeur_admin)


@application.get("/api/sante", tags=["Système"])
def sante():
    return {"statut": "ok"}