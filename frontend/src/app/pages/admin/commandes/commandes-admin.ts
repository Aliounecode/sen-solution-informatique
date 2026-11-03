import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { Commande } from '../../../coeur/modeles/commande';
import { Fcfa } from '../../../coeur/pipes/fcfa';

const LIBELLES: Record<string, string> = {
  nouvelle: 'Nouvelle',
  validee: 'Validée',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

@Component({
  selector: 'app-commandes-admin',
  imports: [Fcfa],
  templateUrl: './commandes-admin.html',
})
export class CommandesAdmin implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly commandes = signal<Commande[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly statut = signal('');
  protected readonly recherche = signal('');
  protected readonly page = signal(1);
  protected readonly taille = 20;

  protected readonly detail = signal<any | null>(null);
  protected readonly action = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly libelles = LIBELLES;
  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      const r = await this.admin.listerCommandes({
        statut: this.statut() || undefined,
        recherche: this.recherche() || undefined,
        page: this.page(),
        taille: this.taille,
      });
      this.commandes.set(r.elements);
      this.total.set(r.total);
    } finally {
      this.chargement.set(false);
    }
  }

  protected async appliquer(): Promise<void> {
    this.page.set(1);
    await this.charger();
  }
  protected async surStatut(v: string): Promise<void> {
    this.statut.set(v);
    await this.appliquer();
  }
  protected async allerPage(c: number): Promise<void> {
    if (c < 1 || c > this.nombrePages()) return;
    this.page.set(c);
    await this.charger();
  }

  protected async ouvrir(commande: Commande): Promise<void> {
    this.erreur.set(null);
    this.detail.set(await this.admin.obtenirCommande((commande as any).id));
  }
  protected fermer(): void {
    this.detail.set(null);
  }

  protected libelle(statut: string): string {
    return LIBELLES[statut] ?? statut;
  }

  protected async changerStatut(statut: string): Promise<void> {
    const d = this.detail();
    if (!d) return;
    if (!confirm(`Passer la commande ${d.reference} au statut « ${this.libelle(statut)} » ?`))
      return;
    this.action.set(true);
    this.erreur.set(null);
    try {
      this.detail.set(await this.admin.changerStatutCommande(d.id, statut));
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Transition impossible.');
    } finally {
      this.action.set(false);
    }
  }
}
