export interface Categorie {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  ordre: number;
  actif: boolean;
}
