export interface TopProduit {
  nom: string;
  quantite: number;
}

export interface VenteJour {
  jour: string; // « 2026-11-05 »
  montant: number;
}

export interface ActiviteJour {
  jour: string;
  commandes: number;
  demandes: number;
}

export interface RepartitionType {
  slug: string;
  libelle: string;
  nombre: number;
}

export interface ProduitStockFaible {
  id: number;
  nom: string;
  reference: string;
  quantite_stock: number;
}

export interface CommandeRecente {
  reference: string;
  nom_client: string;
  statut: string;
  montant_total: number;
  cree_le: string;
}

export interface DemandeRecente {
  reference: string;
  nom_client: string;
  type_appareil: string;
  statut: string;
  cree_le: string;
}

export interface StatistiquesResume {
  chiffre_affaires: number;
  nombre_commandes_total: number;
  commandes_par_statut: Record<string, number>;
  nombre_demandes_total: number;
  demandes_par_statut: Record<string, number>;
  nombre_produits_actifs: number;
  produits_en_rupture: number;
  nombre_clients: number;
  top_produits: TopProduit[];
  commandes_a_traiter: number;
  demandes_a_traiter: number;
  ventes_7_jours: VenteJour[];
  stock_faible: ProduitStockFaible[];
  commandes_recentes: CommandeRecente[];
  demandes_recentes: DemandeRecente[];
  ventes_30_jours: VenteJour[];
  activite_30_jours: ActiviteJour[];
  ca_30_jours: number;
  ca_30_jours_precedents: number;
  repartition_types: RepartitionType[];
}
