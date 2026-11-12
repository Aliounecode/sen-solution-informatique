import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { PageAvis } from '../modeles/avis';

@Injectable({ providedIn: 'root' })
export class AvisService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  /** Avis publiés d'un produit, ou de toute la boutique si produitId est null. */
  lister(produitId: number | null, limite = 6, decalage = 0): Promise<PageAvis> {
    let params = new HttpParams().set('limite', limite).set('decalage', decalage);
    if (produitId !== null) params = params.set('produit_id', produitId);
    return firstValueFrom(this.http.get<PageAvis>(`${this.base}/avis`, { params }));
  }

  deposer(donnees: {
    produit_id: number | null;
    note: number;
    commentaire: string;
    nom_affiche?: string;
  }): Promise<{ message: string }> {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.base}/avis`, donnees));
  }
}
