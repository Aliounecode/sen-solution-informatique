import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { AuthentificationService } from '../../coeur/services/authentification';
import { CommandeService } from '../../coeur/services/commande';
import { DepannageService } from '../../coeur/services/depannage';
import { Commande } from '../../coeur/modeles/commande';
import { Demande } from '../../coeur/modeles/depannage';
import { Fcfa } from '../../coeur/pipes/fcfa';

type Onglet = 'commandes' | 'demandes';

@Component({
  selector: 'app-mon-compte',
  imports: [RouterLink, DatePipe, Fcfa],
  templateUrl: './mon-compte.html',
})
export class MonCompte implements OnInit {
  protected readonly auth = inject(AuthentificationService);
  private readonly commandeService = inject(CommandeService);
  private readonly depannageService = inject(DepannageService);

  protected readonly onglet = signal<Onglet>('commandes');
  protected readonly commandes = signal<Commande[]>([]);
  protected readonly demandes = signal<Demande[]>([]);
  protected readonly chargement = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      const [commandes, demandes] = await Promise.all([
        this.commandeService.mesCommandes(),
        this.depannageService.mesDemandes(),
      ]);
      this.commandes.set(commandes);
      this.demandes.set(demandes);
    } catch {
      /* non bloquant */
    } finally {
      this.chargement.set(false);
    }
  }
}
