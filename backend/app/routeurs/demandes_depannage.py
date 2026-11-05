
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from ..base_donnees import obtenir_session
from ..modeles import StatutDemande, Utilisateur
from ..schemas.demande_depannage import (
    ChangementStatut,
    DemandeAdmin,
    DemandeCreer,
    DemandeModifierAdmin,
    DemandePublic,
    PageDemandes,
    ReponseDevis,
)
from ..securite import exiger_admin, utilisateur_courant
from ..services import service_demande_depannage, service_email


# ----- Espace public / client -----
routeur = APIRouter(
    prefix="/api/demandes",
    tags=["Demandes de dépannage"]
)


@routeur.post(
    "",
    response_model=DemandePublic,
    status_code=status.HTTP_201_CREATED
)
def creer(
    donnees: DemandeCreer,
    background: BackgroundTasks,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    demande = service_demande_depannage.creer(
        session,
        donnees,
        client_id=utilisateur.id
    )

    if demande.email_client:
        background.add_task(
            service_email.confirmation_demande,
            demande.email_client,
            demande.nom_client,
            demande.reference,
            demande.type_appareil,
        )

    return demande


@routeur.get(
    "/suivi/{reference}",
    response_model=DemandePublic
)
def suivi(
    reference: str,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_demande_depannage.obtenir_par_reference_pour(
        session,
        reference,
        utilisateur
    )


@routeur.post(
    "/{reference}/reponse-devis",
    response_model=DemandePublic
)
def reponse_devis(
    reference: str,
    donnees: ReponseDevis,
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_demande_depannage.repondre_devis(
        session,
        reference,
        donnees.accepte,
        utilisateur
    )


# ----- Espace client connecté -----
routeur_compte = APIRouter(
    prefix="/api/compte",
    tags=["Mon compte"]
)


@routeur_compte.get(
    "/demandes",
    response_model=list[DemandePublic]
)
def mes_demandes(
    session: Session = Depends(obtenir_session),
    utilisateur: Utilisateur = Depends(utilisateur_courant),
):
    return service_demande_depannage.lister_pour_client(
        session,
        utilisateur.id
    )


# ----- Espace admin -----
routeur_admin = APIRouter(
    prefix="/api/admin/demandes",
    tags=["Admin · Demandes de dépannage"],
    dependencies=[Depends(exiger_admin)],
)


@routeur_admin.get("", response_model=PageDemandes)
def liste_admin(
    session: Session = Depends(obtenir_session),
    statut: StatutDemande | None = None,
    technicien_id: int | None = None,
    recherche: str | None = None,
    page: int = Query(default=1, ge=1),
    taille: int = Query(default=20, ge=1, le=100),
):
    total, elements = service_demande_depannage.lister(
        session,
        statut=statut,
        technicien_id=technicien_id,
        recherche=recherche,
        page=page,
        taille=taille,
    )

    return PageDemandes(
        total=total,
        page=page,
        taille=taille,
        elements=elements
    )


@routeur_admin.get("/{demande_id}", response_model=DemandeAdmin)
def detail_admin(
    demande_id: int,
    session: Session = Depends(obtenir_session)
):
    return service_demande_depannage.obtenir(session, demande_id)


@routeur_admin.put("/{demande_id}", response_model=DemandeAdmin)
def modifier(
    demande_id: int,
    donnees: DemandeModifierAdmin,
    session: Session = Depends(obtenir_session)
):
    return service_demande_depannage.modifier(
        session,
        demande_id,
        donnees
    )


@routeur_admin.post("/{demande_id}/statut", response_model=DemandeAdmin)
def changer_statut(
    demande_id: int,
    donnees: ChangementStatut,
    background: BackgroundTasks,
    session: Session = Depends(obtenir_session),
):
    demande = service_demande_depannage.changer_statut(
        session,
        demande_id,
        donnees.statut
    )

    if demande.email_client:
        background.add_task(
            service_email.notification_statut_demande,
            demande.email_client,
            demande.nom_client,
            demande.reference,
            demande.statut.value,
            demande.diagnostic,
            demande.montant_devis,
        )

    return demande
