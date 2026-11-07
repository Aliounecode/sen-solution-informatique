import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdministrationService } from '../../../coeur/services/administration';
import { StatistiquesResume } from '../../../coeur/modeles/statistiques';
import { Fcfa } from '../../../coeur/pipes/fcfa';
import { GraphiqueAire, SerieAire } from '../../../composants/graphiques/graphique-aire';
import { GraphiqueDonut, PartDonut } from '../../../composants/graphiques/graphique-donut';
import { MiniCourbe } from '../../../composants/graphiques/mini-courbe';
import { jourCourt } from '../../../composants/graphiques/outils';

type Periode = 7 | 30;

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

const LIBELLE_STATUT_UNIQUE: Record<string, string> = {
  nouvelle: 'Nouvelle',
  validee: 'Validée',
  refusee: 'Refusée',
  annulee: 'Annulée',
  recue: 'Reçue',
  diagnostic: 'Diagnostic',
  devis: 'Devis',
  en_reparation: 'En réparation',
  prete: 'Prête',
  livree: 'Livrée',
};

const COULEUR_STATUT: Record<string, string> = {
  nouvelle: 'var(--adm-c3)',
  recue: 'var(--adm-c3)',
  diagnostic: 'var(--adm-c2)',
  devis: 'var(--adm-c4)',
  en_reparation: 'var(--adm-c1)',
  prete: 'var(--adm-c5)',
  validee: 'var(--adm-c5)',
  livree: 'var(--adm-c5)',
  refusee: 'var(--color-orange)',
  annulee: 'var(--color-orange)',
};

const PALETTE = [
  'var(--adm-c1)',
  'var(--adm-c2)',
  'var(--adm-c3)',
  'var(--adm-c4)',
  'var(--adm-c5)',
];

const ICONES = {
  argent: 'M12 2v20M17 6.5C16 5 14.2 4 12 4c-2.8 0-5 1.5-5 3.5S9.2 11 12 11s5 1.5 5 3.5-2.2 3.5-5 3.5c-2.3 0-4.2-1-5.2-2.5',
  panier: 'M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01',
  cle: 'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.5-.7-.7-2.5 2.7-2.3z',
  boite: 'M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  clients: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-5-6.7',
  alerte: 'M12 3 2 20h20L12 3zM12 10v4M12 17h.01',
  plus: 'M12 5v14M5 12h14',
};

@Component({
  selector: 'app-tableau-bord',
  imports: [RouterLink, DatePipe, Fcfa, GraphiqueAire, GraphiqueDonut, MiniCourbe],
  templateUrl: './tableau-bord.html',
})
export class TableauBord implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly stats = signal<StatistiquesResume | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly periode = signal<Periode>(30);
  protected readonly aujourdhui = new Date();
  protected readonly icones = ICONES;

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  protected async charger(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      this.stats.set(await this.admin.statistiques());
    } catch {
      this.erreur.set('Impossible de charger les statistiques.');
    } finally {
      this.chargement.set(false);
    }
  }

  // ---------- Ventes ----------
  private readonly ventes = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const source = s.ventes_30_jours?.length ? s.ventes_30_jours : (s.ventes_7_jours ?? []);
    return source.slice(-this.periode());
  });

  protected readonly etiquettesVentes = computed(() => this.ventes().map((v) => jourCourt(v.jour)));

  protected readonly seriesVentes = computed<SerieAire[]>(() => [
    {
      nom: "Chiffre d'affaires",
      couleur: 'var(--adm-c1)',
      valeurs: this.ventes().map((v) => v.montant),
    },
  ]);

  protected readonly totalPeriode = computed(() =>
    this.ventes().reduce((somme, v) => somme + v.montant, 0),
  );

  protected readonly meilleurJour = computed(() => {
    const liste = this.ventes();
    if (!liste.length) return null;
    return liste.reduce((a, b) => (b.montant > a.montant ? b : a));
  });

  protected readonly sparkVentes = computed(() => {
    const s = this.stats();
    return (s?.ventes_30_jours ?? s?.ventes_7_jours ?? []).map((v) => v.montant);
  });

  /** Évolution du CA sur 30 jours par rapport aux 30 jours précédents (en %), null si non calculable. */
  protected readonly tendanceCa = computed(() => {
    const s = this.stats();
    if (!s || !s.ca_30_jours_precedents) return null;
    return Math.round(((s.ca_30_jours - s.ca_30_jours_precedents) / s.ca_30_jours_precedents) * 100);
  });

  // ---------- Activité ----------
  protected readonly etiquettesActivite = computed(() =>
    (this.stats()?.activite_30_jours ?? []).map((a) => jourCourt(a.jour)),
  );

  protected readonly seriesActivite = computed<SerieAire[]>(() => {
    const liste = this.stats()?.activite_30_jours ?? [];
    return [
      { nom: 'Commandes', couleur: 'var(--adm-c2)', valeurs: liste.map((a) => a.commandes) },
      { nom: 'Dépannages', couleur: 'var(--adm-c4)', valeurs: liste.map((a) => a.demandes) },
    ];
  });

  protected readonly sparkCommandes = computed(() =>
    (this.stats()?.activite_30_jours ?? []).map((a) => a.commandes),
  );
  protected readonly sparkDemandes = computed(() =>
    (this.stats()?.activite_30_jours ?? []).map((a) => a.demandes),
  );

  // ---------- Répartitions ----------
  protected readonly partsCommandes = computed<PartDonut[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return Object.entries(s.commandes_par_statut).map(([cle, valeur]) => ({
      libelle: LIBELLES_COMMANDE[cle] ?? cle,
      valeur,
      couleur: COULEUR_STATUT[cle] ?? 'var(--adm-c1)',
    }));
  });

  protected readonly partsTypes = computed<PartDonut[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return (s.repartition_types ?? []).map((t, i) => ({
      libelle: t.libelle,
      valeur: t.nombre,
      couleur: PALETTE[i % PALETTE.length],
    }));
  });

  protected readonly demandesParStatut = computed(() => {
    const s = this.stats();
    if (!s) return [];
    const total = Math.max(1, ...Object.values(s.demandes_par_statut));
    return Object.entries(s.demandes_par_statut).map(([cle, valeur]) => ({
      libelle: LIBELLES_DEMANDE[cle] ?? cle,
      valeur,
      pct: Math.round((valeur / total) * 100),
      couleur: COULEUR_STATUT[cle] ?? 'var(--adm-c1)',
    }));
  });

  protected readonly topProduits = computed(() => {
    const liste = this.stats()?.top_produits ?? [];
    const max = Math.max(1, ...liste.map((p) => p.quantite));
    return liste.map((p, i) => ({
      ...p,
      pct: Math.round((p.quantite / max) * 100),
      couleur: PALETTE[i % PALETTE.length],
    }));
  });

  // ---------- Utilitaires de gabarit ----------
  protected libelleStatut(statut: string): string {
    return LIBELLE_STATUT_UNIQUE[statut] ?? statut;
  }

  protected couleurStatut(statut: string): string {
    return COULEUR_STATUT[statut] ?? 'var(--color-encre-attenue)';
  }

  protected formatFcfa = (n: number): string => `${n.toLocaleString('fr-FR')} FCFA`;

  protected delai(i: number): string {
    return `${i * 60}ms`;
  }
}
