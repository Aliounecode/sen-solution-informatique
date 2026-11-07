from datetime import date, datetime

from pydantic import BaseModel


class ProduitPopulaire(BaseModel):
    nom: str
    quantite: int


# Ancien nom conservé au cas où un autre fichier l'importerait encore
TopProduit = ProduitPopulaire


class VenteJour(BaseModel):
    jour: date
    montant: int


class ActiviteJour(BaseModel):
    jour: date
    commandes: int
    demandes: int


class RepartitionType(BaseModel):
    slug: str
    libelle: str
    nombre: int


class ProduitStockFaible(BaseModel):
    id: int
    nom: str
    reference: str
    quantite_stock: int


class CommandeRecente(BaseModel):
    reference: str
    nom_client: str
    statut: str
    montant_total: int
    cree_le: datetime


class DemandeRecente(BaseModel):
    reference: str
    nom_client: str
    type_appareil: str
    statut: str
    cree_le: datetime


class StatistiquesResume(BaseModel):
    chiffre_affaires: int
    nombre_commandes_total: int
    commandes_par_statut: dict[str, int]
    nombre_demandes_total: int
    demandes_par_statut: dict[str, int]
    nombre_produits_actifs: int
    produits_en_rupture: int
    nombre_clients: int
    top_produits: list[ProduitPopulaire]
    commandes_a_traiter: int
    demandes_a_traiter: int
    ventes_7_jours: list[VenteJour]
    stock_faible: list[ProduitStockFaible]
    commandes_recentes: list[CommandeRecente]
    demandes_recentes: list[DemandeRecente]
    # --- Ajouts pour le nouveau tableau de bord ---
    ventes_30_jours: list[VenteJour]
    activite_30_jours: list[ActiviteJour]
    ca_30_jours: int
    ca_30_jours_precedents: int
    repartition_types: list[RepartitionType]