import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { CommandeService } from '../../coeur/services/commande';
import { Commande, StatutCommande } from '../../coeur/modeles/commande';
import { Fcfa } from '../../coeur/pipes/fcfa';

const LIBELLES: Record<StatutCommande, string> = {
  nouvelle: 'Reçue — en attente de validation',
  validee: 'Validée — en préparation',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

@Component({
  selector: 'app-suivi',
  imports: [DatePipe, Fcfa],
  templateUrl: './suivi.html',
})
export class Suivi implements OnInit {
  private readonly commandeService = inject(CommandeService);
  private readonly route = inject(ActivatedRoute);

  protected readonly reference = signal('');
  protected readonly commande = signal<Commande | null>(null);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) {
      this.reference.set(ref);
      this.rechercher();
    }
  }

  protected async rechercher(): Promise<void> {
    const ref = this.reference().trim();
    if (!ref) return;
    this.chargement.set(true);
    this.erreur.set(null);
    this.commande.set(null);
    try {
      this.commande.set(await this.commandeService.suivi(ref));
    } catch {
      this.erreur.set('Aucune commande trouvée pour cette référence.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected libelle(statut: StatutCommande): string {
    return LIBELLES[statut];
  }
}
