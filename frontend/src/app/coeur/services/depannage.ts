import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { Demande, DemandeCreer, Prestation } from '../modeles/depannage';

@Injectable({ providedIn: 'root' })
export class DepannageService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  listerPrestations(): Promise<Prestation[]> {
    return firstValueFrom(this.http.get<Prestation[]>(`${this.base}/prestations`));
  }

  creerDemande(donnees: DemandeCreer): Promise<Demande> {
    return firstValueFrom(this.http.post<Demande>(`${this.base}/demandes`, donnees));
  }

  suivi(reference: string): Promise<Demande> {
    return firstValueFrom(
      this.http.get<Demande>(`${this.base}/demandes/suivi/${reference.trim()}`),
    );
  }

  repondreDevis(reference: string, accepte: boolean): Promise<Demande> {
    return firstValueFrom(
      this.http.post<Demande>(`${this.base}/demandes/${reference.trim()}/reponse-devis`, {
        accepte,
      }),
    );
  }

  mesDemandes(): Promise<Demande[]> {
    return firstValueFrom(this.http.get<Demande[]>(`${this.base}/compte/demandes`));
  }
}
