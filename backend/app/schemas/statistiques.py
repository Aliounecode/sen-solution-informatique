from datetime import date, datetime

from pydantic import BaseModel


class ProduitPopulaire(BaseModel):
    nom: str
    quantite: int


class VenteJour(BaseModel):
    jour: date
    montant: int


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