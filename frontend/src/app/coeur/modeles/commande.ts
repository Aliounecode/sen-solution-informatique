export type StatutCommande = 'nouvelle' | 'validee' | 'refusee' | 'annulee';
export type ModeRetrait = 'retrait_boutique' | 'livraison';
export type MoyenPaiement = 'especes' | 'orange_money' | 'wave' | 'carte' | 'autre';

export interface LigneCommande {
  id: number;
  produit_id: number | null;
  nom_produit: string;
  reference_produit: string;
  prix_unitaire: number;
  quantite: number;
  sous_total: number;
}

export interface Commande {
  reference: string;
  statut: StatutCommande;
  mode_retrait: ModeRetrait;
  adresse_livraison: string | null;
  moyen_paiement: MoyenPaiement | null;
  montant_total: number;
  note_client: string | null;
  lignes: LigneCommande[];
  cree_le: string;
  modifie_le: string;
}

export interface CommandeCreer {
  nom_client: string;
  telephone_client: string;
  email_client?: string;
  mode_retrait: ModeRetrait;
  adresse_livraison?: string;
  moyen_paiement?: MoyenPaiement;
  note_client?: string;
  lignes: { produit_id: number; quantite: number }[];
}
