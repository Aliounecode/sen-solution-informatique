import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { StatistiquesResume } from '../../../coeur/modeles/statistiques';
import { Fcfa } from '../../../coeur/pipes/fcfa';
import { AdministrationService } from '../../../coeur/services/administration';

const LIBELLES_COMMANDE: Record<string, string> = {
  nouvelle: 'Nouvelles',
  validee: 'Validées',
  refusee: 'Refusées',
  annulee: 'Annulées',
};

const LIBELLES_DEMANDE: Record<string, string> = {
  recue: 'Reçues',
  diagnostic: 'Diagnostic',
  devis: 'Devis',
  en_reparation: 'En réparation',
  prete: 'Prêtes',
  livree: 'Livrées',
  annulee: 'Annulées',
};

@Component({
  selector: 'app-tableau-bord',
  imports: [Fcfa, RouterLink, DatePipe],
  templateUrl: './tableau-bord.html',
})
export class TableauBord implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly stats = signal<StatistiquesResume | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly commandes = computed(() =>
    this._versListe(this.stats()?.commandes_par_statut, LIBELLES_COMMANDE),
  );
  protected readonly demandes = computed(() =>
    this._versListe(this.stats()?.demandes_par_statut, LIBELLES_DEMANDE),
  );

  protected readonly ventes = computed(() => {
    const liste = this.stats()?.ventes_7_jours ?? [];
    const max = Math.max(0, ...liste.map((v) => v.montant));
    return liste.map((v) => ({
      montant: v.montant,
      etiquette: new Date(`${v.jour}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short' }),
      hauteur: v.montant > 0 && max > 0 ? Math.max(6, Math.round((v.montant / max) * 100)) : 0,
    }));
  });
  protected readonly totalVentes = computed(() =>
    (this.stats()?.ventes_7_jours ?? []).reduce((somme, v) => somme + v.montant, 0),
  );

  async ngOnInit(): Promise<void> {
    try {
      this.stats.set(await this.admin.statistiques());
    } catch {
      this.erreur.set('Impossible de charger les statistiques.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected libelleStatut(statut: string): string {
    return statut.replace('_', ' ');
  }

  private _versListe(
    source: Record<string, number> | undefined,
    libelles: Record<string, string>,
  ): { libelle: string; valeur: number }[] {
    if (!source) return [];
    return Object.entries(libelles).map(([cle, libelle]) => ({
      libelle,
      valeur: source[cle] ?? 0,
    }));
  }
}
