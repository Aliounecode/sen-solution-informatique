from fastapi import APIRouter,BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import StatutCommande, Utilisateur
from ..schemas.commande import (
    ChangementStatutCommande,
    CommandeAdmin,
    CommandeCreer,
    CommandeModifierAdmin,
    CommandePublic,
    PageCommandes,
)
from ..securite import exiger_admin, utilisateur_courant, utilisateur_courant_optionnel
from ..services import service_commande , service_email

# ----- Espace public / client -----
routeur = APIRouter(prefix="/api/commandes", tags=["Commandes"])


@routeur.post("", response_model=CommandePublic, status_code=status.HTTP_201_CREATED)
def creer(
    donnees: CommandeCreer,
    background: BackgroundTasks,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    commande = service_commande.creer(session, donnees, client_id=utilisateur.id)
    if commande.email_client:
        background.add_task(
            service_email.confirmation_commande,
            commande.email_client, commande.nom_client, commande.reference,
            commande.montant_total,
            [(l.quantite, l.nom_produit, l.sous_total) for l in commande.lignes],
        )
    return commande


@routeur.get("/suivi/{reference}", response_model=CommandePublic)
def suivi(
    reference: str,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_commande.obtenir_par_reference_pour(session, reference, utilisateur)


@routeur.post("/{reference}/annuler", response_model=CommandePublic)
def annuler(
    reference: str,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_commande.annuler_par_reference(session, reference, utilisateur)


# ----- Espace client connecté -----
routeur_compte = APIRouter(prefix="/api/compte", tags=["Mon compte"])


@routeur_compte.get("/commandes", response_model=list[CommandePublic])
def mes_commandes(
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_commande.lister_pour_client(session, utilisateur.id)


# ----- Espace admin -----
routeur_admin = APIRouter(
    prefix="/api/admin/commandes",
    tags=["Admin · Commandes"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=PageCommandes)
def liste_admin(
    session: Session = Depends(obtenir_session),
    statut: StatutCommande | None = None,
    recherche: str | None = None,
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=20, ge=1, le=100),
):
    total, elements = service_commande.lister(
        session, statut=statut, recherche=recherche, page=page, taille=taille
    )
    return PageCommandes(total=total, page=page, taille=taille, elements=elements)


@routeur_admin.get("/{commande_id}", response_model=CommandeAdmin)
def detail_admin(commande_id: int, session: Session = Depends(obtenir_session)):
    return service_commande.obtenir(session, commande_id)


@routeur_admin.put("/{commande_id}", response_model=CommandeAdmin)
def modifier(commande_id: int, donnees: CommandeModifierAdmin, session: Session = Depends(obtenir_session)):
    return service_commande.modifier(session, commande_id, donnees)


@routeur_admin.post("/{commande_id}/statut", response_model=CommandeAdmin)
def changer_statut(
    commande_id: int,
    donnees: ChangementStatutCommande,
    background: BackgroundTasks,
    session: Session = Depends(obtenir_session),
):
    commande = service_commande.changer_statut(session, commande_id, donnees.statut)
    if commande.email_client:
        background.add_task(
            service_email.notification_statut_commande,
            commande.email_client, commande.nom_client, commande.reference,
            commande.statut.value, commande.montant_total,
        )
    return commande