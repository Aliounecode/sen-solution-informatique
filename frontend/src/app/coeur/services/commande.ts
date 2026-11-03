import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { Commande, CommandeCreer } from '../modeles/commande';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  creer(donnees: CommandeCreer): Promise<Commande> {
    return firstValueFrom(this.http.post<Commande>(`${this.base}/commandes`, donnees));
  }

  suivi(reference: string): Promise<Commande> {
    return firstValueFrom(
      this.http.get<Commande>(`${this.base}/commandes/suivi/${reference.trim()}`),
    );
  }

  annuler(reference: string): Promise<Commande> {
    return firstValueFrom(
      this.http.post<Commande>(`${this.base}/commandes/${reference.trim()}/annuler`, {}),
    );
  }

  mesCommandes(): Promise<Commande[]> {
    return firstValueFrom(this.http.get<Commande[]>(`${this.base}/compte/commandes`));
  }
}
