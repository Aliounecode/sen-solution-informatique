export type TypeProduit = 'ordinateur' | 'accessoire';

export interface ImageProduit {
  id: number;
  url: string;
  public_id: string | null;
  ordre: number;
  est_principale: boolean;
}

export interface ProduitResume {
  id: number;
  reference: string;
  nom: string;
  slug: string;
  categorie_id: number;
  type_produit: TypeProduit;
  marque: string | null;
  prix: number;
  prix_promo: number | null;
  promo_active: boolean;
  quantite_stock: number;
  en_vedette: boolean;
  actif: boolean;
  images: ImageProduit[];
}

export interface ProduitComplet extends ProduitResume {
  modele: string | null;
  description: string | null;
  caracteristiques: Record<string, unknown>;
}

export interface PageProduits {
  total: number;
  page: number;
  taille: number;
  elements: ProduitResume[];
}
