from datetime import datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..modeles import (
    Commande,
    DemandeDepannage,
    LigneCommande,
    Produit,
    RoleUtilisateur,
    StatutCommande,
    StatutDemande,
    Utilisateur,
)

SEUIL_STOCK_FAIBLE = 3


def _valeur(statut) -> str:
    return statut.value if hasattr(statut, "value") else str(statut)


def _ventes_7_jours(session: Session) -> list[dict]:
    aujourd_hui = datetime.now(timezone.utc).date()
    debut = aujourd_hui - timedelta(days=6)
    par_jour = {debut + timedelta(days=i): 0 for i in range(7)}
    lignes = session.execute(
        select(Commande.cree_le, Commande.montant_total).where(
            Commande.statut == StatutCommande.validee,
            Commande.cree_le >= datetime.combine(debut, time.min, tzinfo=timezone.utc),
        )
    ).all()
    for cree_le, montant in lignes:
        jour = cree_le.date()
        if jour in par_jour:
            par_jour[jour] += montant
    return [{"jour": j.isoformat(), "montant": m} for j, m in par_jour.items()]


def resume(session: Session) -> dict:
    chiffre_affaires = session.scalar(
        select(func.coalesce(func.sum(Commande.montant_total), 0)).where(
            Commande.statut == StatutCommande.validee
        )
    ) or 0

    nombre_commandes = session.scalar(select(func.count()).select_from(Commande)) or 0
    commandes_par_statut = {s.value: 0 for s in StatutCommande}
    for statut, nombre in session.execute(
        select(Commande.statut, func.count()).group_by(Commande.statut)
    ):
        commandes_par_statut[_valeur(statut)] = nombre

    nombre_demandes = session.scalar(select(func.count()).select_from(DemandeDepannage)) or 0
    demandes_par_statut = {s.value: 0 for s in StatutDemande}
    for statut, nombre in session.execute(
        select(DemandeDepannage.statut, func.count()).group_by(DemandeDepannage.statut)
    ):
        demandes_par_statut[_valeur(statut)] = nombre

    produits_actifs = session.scalar(
        select(func.count()).select_from(Produit).where(Produit.actif.is_(True))
    ) or 0
    produits_en_rupture = session.scalar(
        select(func.count())
        .select_from(Produit)
        .where(Produit.actif.is_(True), Produit.quantite_stock == 0)
    ) or 0

    nombre_clients = session.scalar(
        select(func.count())
        .select_from(Utilisateur)
        .where(Utilisateur.role == RoleUtilisateur.client)
    ) or 0

    top_produits = [
        {"nom": nom, "quantite": int(quantite)}
        for nom, quantite in session.execute(
            select(LigneCommande.nom_produit, func.sum(LigneCommande.quantite))
            .join(Commande, Commande.id == LigneCommande.commande_id)
            .where(Commande.statut == StatutCommande.validee)
            .group_by(LigneCommande.nom_produit)
            .order_by(func.sum(LigneCommande.quantite).desc())
            .limit(5)
        )
    ]

    stock_faible = [
        {"id": p.id, "nom": p.nom, "reference": p.reference, "quantite_stock": p.quantite_stock}
        for p in session.scalars(
            select(Produit)
            .where(Produit.actif.is_(True), Produit.quantite_stock <= SEUIL_STOCK_FAIBLE)
            .order_by(Produit.quantite_stock.asc(), Produit.nom.asc())
            .limit(8)
        )
    ]

    commandes_recentes = [
        {
            "reference": c.reference, "nom_client": c.nom_client,
            "statut": _valeur(c.statut), "montant_total": c.montant_total, "cree_le": c.cree_le,
        }
        for c in session.scalars(select(Commande).order_by(Commande.cree_le.desc()).limit(5))
    ]
    demandes_recentes = [
        {
            "reference": d.reference, "nom_client": d.nom_client,
            "type_appareil": d.type_appareil, "statut": _valeur(d.statut), "cree_le": d.cree_le,
        }
        for d in session.scalars(
            select(DemandeDepannage).order_by(DemandeDepannage.cree_le.desc()).limit(5)
        )
    ]

    return {
        "chiffre_affaires": chiffre_affaires,
        "nombre_commandes_total": nombre_commandes,
        "commandes_par_statut": commandes_par_statut,
        "nombre_demandes_total": nombre_demandes,
        "demandes_par_statut": demandes_par_statut,
        "nombre_produits_actifs": produits_actifs,
        "produits_en_rupture": produits_en_rupture,
        "nombre_clients": nombre_clients,
        "top_produits": top_produits,
        "commandes_a_traiter": commandes_par_statut.get("nouvelle", 0),
        "demandes_a_traiter": demandes_par_statut.get("recue", 0),
        "ventes_7_jours": _ventes_7_jours(session),
        "stock_faible": stock_faible,
        "commandes_recentes": commandes_recentes,
        "demandes_recentes": demandes_recentes,
    }