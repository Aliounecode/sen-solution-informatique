export type TypeValeur = 'texte' | 'nombre' | 'booleen' | 'liste';

export interface Specification {
  id: number;
  cle: string;
  libelle: string;
  groupe: string | null;
  type_valeur: TypeValeur;
  unite: string | null;
  options: string[] | null;
  /** Slugs des types concernés ; null ou vide = tous les types. */
  types: string[] | null;
  ordre: number;
  actif: boolean;
}
