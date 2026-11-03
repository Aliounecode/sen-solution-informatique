import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { Categorie } from '../modeles/categorie';
import { PageProduits, ProduitComplet, TypeProduit, ProduitResume } from '../modeles/produit';
import { Specification } from '../modeles/specification';

export interface FiltresProduits {
  categorie_id?: number;
  type_produit?: TypeProduit;
  recherche?: string;
  en_vedette?: boolean;
  prix_min?: number;
  prix_max?: number;
  tri?: string;
  page?: number;
  taille?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  listerCategories(): Promise<Categorie[]> {
    return firstValueFrom(this.http.get<Categorie[]>(`${this.base}/categories`));
  }

  listerSpecifications(): Promise<Specification[]> {
    return firstValueFrom(this.http.get<Specification[]>(`${this.base}/specifications`));
  }

  listerProduits(filtres: FiltresProduits = {}): Promise<PageProduits> {
    return firstValueFrom(
      this.http.get<PageProduits>(`${this.base}/produits`, {
        params: this._construireParams(filtres),
      }),
    );
  }

  obtenirProduit(slug: string): Promise<ProduitComplet> {
    return firstValueFrom(this.http.get<ProduitComplet>(`${this.base}/produits/${slug}`));
  }
  produitsSimilaires(slug: string, limite = 4): Promise<ProduitResume[]> {
    return firstValueFrom(
      this.http.get<ProduitResume[]>(`${this.base}/produits/${slug}/similaires`, {
        params: { limite },
      }),
    );
  }

  private _construireParams(filtres: FiltresProduits): HttpParams {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        params = params.set(cle, String(valeur));
      }
    }
    return params;
  }
}
