import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { Fcfa } from '../../../coeur/pipes/fcfa';

const LIBELLES: Record<string, string> = {
  recue: 'Reçue',
  diagnostic: 'Diagnostic',
  devis: 'Devis',
  en_reparation: 'En réparation',
  prete: 'Prête',
  livree: 'Livrée',
  annulee: 'Annulée',
};

// Transitions autorisées (miroir du backend, pour n'afficher que les boutons pertinents)
const SUIVANTS: Record<string, string[]> = {
  recue: ['diagnostic', 'annulee'],
  diagnostic: ['devis', 'en_reparation', 'annulee'],
  devis: ['en_reparation', 'annulee'],
  en_reparation: ['prete', 'annulee'],
  prete: ['livree', 'annulee'],
  livree: [],
  annulee: [],
};

@Component({
  selector: 'app-demandes-admin',
  imports: [Fcfa],
  templateUrl: './demandes-admin.html',
})
export class DemandesAdmin implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly demandes = signal<any[]>([]);
  protected readonly techniciens = signal<any[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly statut = signal('');
  protected readonly recherche = signal('');
  protected readonly page = signal(1);
  protected readonly taille = 20;

  protected readonly detail = signal<any | null>(null);
  protected readonly action = signal(false);
  protected readonly erreur = signal<string | null>(null);

  // Champs d'édition du détail
  protected readonly diagnostic = signal('');
  protected readonly montantDevis = signal<number | null>(null);
  protected readonly technicienId = signal<number | null>(null);
  protected readonly noteInterne = signal('');

  protected readonly libelles = LIBELLES;
  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );
  protected readonly transitions = computed(() => {
    const d = this.detail();
    return d ? (SUIVANTS[d.statut] ?? []) : [];
  });

  async ngOnInit(): Promise<void> {
    try {
      this.techniciens.set(await this.admin.listerTechniciens());
    } catch {
      /* */
    }
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      const r = await this.admin.listerDemandes({
        statut: this.statut() || undefined,
        recherche: this.recherche() || undefined,
        page: this.page(),
        taille: this.taille,
      });
      this.demandes.set(r.elements);
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

  protected libelle(statut: string): string {
    return LIBELLES[statut] ?? statut;
  }

  protected async ouvrir(demande: any): Promise<void> {
    this.erreur.set(null);
    const d = await this.admin.obtenirDemande(demande.id);
    this.detail.set(d);
    this.diagnostic.set(d.diagnostic ?? '');
    this.montantDevis.set(d.montant_devis);
    this.technicienId.set(d.technicien?.id ?? null);
    this.noteInterne.set(d.note_interne ?? '');
  }
  protected fermer(): void {
    this.detail.set(null);
  }

  protected async enregistrerDetail(): Promise<void> {
    const d = this.detail();
    if (!d) return;
    this.action.set(true);
    this.erreur.set(null);
    try {
      const maj = await this.admin.modifierDemande(d.id, {
        diagnostic: this.diagnostic().trim() || null,
        montant_devis: this.montantDevis(),
        technicien_id: this.technicienId(),
        note_interne: this.noteInterne().trim() || null,
      });
      this.detail.set(maj);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.action.set(false);
    }
  }

  protected async changerStatut(statut: string): Promise<void> {
    const d = this.detail();
    if (!d) return;
    this.action.set(true);
    this.erreur.set(null);
    try {
      const maj = await this.admin.changerStatutDemande(d.id, statut);
      this.detail.set(maj);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Transition impossible.');
    } finally {
      this.action.set(false);
    }
  }
}
