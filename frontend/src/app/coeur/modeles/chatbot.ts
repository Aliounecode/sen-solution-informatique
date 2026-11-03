import { ProduitResume } from './produit';

export interface MessageChat {
  role: 'user' | 'assistant';
  contenu: string;
}

export interface ContactBoutique {
  telephone: string;
  whatsapp: string;
}

export interface ReponseChat {
  reponse: string;
  produits: ProduitResume[];
  contact: ContactBoutique;
  mode: 'ia' | 'simple';
}
