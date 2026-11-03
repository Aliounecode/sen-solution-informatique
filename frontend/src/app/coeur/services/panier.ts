import { Injectable, computed, effect, signal } from '@angular/core';

const CLE = 'ssi_panier';

export interface ArticlePanier {
  produit_id: number;
  nom: string;
  slug: string;
  prix: number; // prix effectif au moment de l'ajout (FCFA)
  image: string | null;
  quantite: number;
}

function charger(): ArticlePanier[] {
  try {
    return JSON.parse(localStorage.getItem(CLE) ?? '[]');
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class PanierService {
  private readonly _articles = signal<ArticlePanier[]>(charger());

  readonly articles = this._articles.asReadonly();
  readonly nombreArticles = computed(() =>
    this._articles().reduce((total, a) => total + a.quantite, 0),
  );
  readonly total = computed(() =>
    this._articles().reduce((total, a) => total + a.prix * a.quantite, 0),
  );

  constructor() {
    effect(() => localStorage.setItem(CLE, JSON.stringify(this._articles())));
  }

  ajouter(article: Omit<ArticlePanier, 'quantite'>, quantite = 1): void {
    this._articles.update((articles) => {
      const existant = articles.find((a) => a.produit_id === article.produit_id);
      if (existant) {
        return articles.map((a) =>
          a.produit_id === article.produit_id ? { ...a, quantite: a.quantite + quantite } : a,
        );
      }
      return [...articles, { ...article, quantite }];
    });
  }

  modifierQuantite(produit_id: number, quantite: number): void {
    if (quantite <= 0) return this.retirer(produit_id);
    this._articles.update((articles) =>
      articles.map((a) => (a.produit_id === produit_id ? { ...a, quantite } : a)),
    );
  }

  retirer(produit_id: number): void {
    this._articles.update((articles) => articles.filter((a) => a.produit_id !== produit_id));
  }

  vider(): void {
    this._articles.set([]);
  }
}
