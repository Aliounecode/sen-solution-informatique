export type RoleUtilisateur = 'client' | 'admin';

export interface Utilisateur {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string | null;
  role: RoleUtilisateur;
  actif: boolean;
  cree_le: string;
}
