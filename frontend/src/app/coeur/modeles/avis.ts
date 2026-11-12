export type StatutAvis = 'en_attente' | 'publie' | 'refuse';

export interface Avis {
  id: number;
  nom_affiche: string;
  note: number;
  commentaire: string;
  produit_id: number | null;
  produit_nom: string | null;
  produit_slug: string | null;
  cree_le: string;
}

export interface AvisAdmin extends Avis {
  statut: StatutAvis;
  utilisateur_id: number | null;
}

export interface PageAvis {
  moyenne: number | null;
  total: number;
  elements: Avis[];
}

export interface PageAvisAdmin {
  total: number;
  en_attente: number;
  page: number;
  taille: number;
  elements: AvisAdmin[];
}
