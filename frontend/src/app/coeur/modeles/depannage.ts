export type StatutDemande =
  | 'recue'
  | 'diagnostic'
  | 'devis'
  | 'en_reparation'
  | 'prete'
  | 'livree'
  | 'annulee';

export interface Prestation {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  tarif: number | null; // FCFA, null = sur devis
  duree_estimee: string | null;
  ordre: number;
  actif: boolean;
}

export interface Demande {
  reference: string;
  statut: StatutDemande;
  type_appareil: string;
  marque_appareil: string | null;
  modele_appareil: string | null;
  description_panne: string;
  diagnostic: string | null;
  montant_devis: number | null;
  devis_accepte: boolean | null;
  prestation: Prestation | null;
  cree_le: string;
  modifie_le: string;
}

export interface DemandeCreer {
  nom_client: string;
  telephone_client: string;
  email_client?: string;
  type_appareil: string;
  marque_appareil?: string;
  modele_appareil?: string;
  description_panne: string;
  prestation_id?: number;
}
