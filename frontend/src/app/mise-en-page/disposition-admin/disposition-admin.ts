import { Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BasculeTheme } from '../../composants/bascule-theme/bascule-theme';
import { AuthentificationService } from '../../coeur/services/authentification';
import { ThemeService } from '../../coeur/services/theme';

interface LienAdmin {
  chemin: string;
  libelle: string;
  /** Tracé SVG (grille 24×24, trait). */
  icone: string;
}

interface SectionAdmin {
  titre: string;
  liens: LienAdmin[];
}

@Component({
  selector: 'app-disposition-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, BasculeTheme],
  templateUrl: './disposition-admin.html',
  styleUrl: './disposition-admin.css',
  // Les styles .adm doivent atteindre les pages enfants (router-outlet).
  encapsulation: ViewEncapsulation.None,
})
export class DispositionAdmin {
  protected readonly auth = inject(AuthentificationService);
  protected readonly theme = inject(ThemeService);
  private readonly routeur = inject(Router);

  protected readonly menuOuvert = signal(false);

  protected readonly sections: SectionAdmin[] = [
    {
      titre: 'Pilotage',
      liens: [
        {
          chemin: '/admin',
          libelle: 'Tableau de bord',
          icone: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
        },
      ],
    },
    {
      titre: 'Catalogue',
      liens: [
        {
          chemin: '/admin/produits',
          libelle: 'Produits',
          icone: 'M21 8 12 3 3 8v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
        },
        {
          chemin: '/admin/categories',
          libelle: 'Catégories',
          icone: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
        },
        {
          chemin: '/admin/types',
          libelle: 'Types de produits',
          icone: 'M12 3 2 8l10 5 10-5-10-5zM2 12.5l10 5 10-5M2 17l10 5 10-5',
        },
        {
          chemin: '/admin/specifications',
          libelle: 'Spécifications',
          icone: 'M4 6h10M18 6h2M4 12h3M11 12h9M4 18h11M19 18h1M14 4v4M7 10v4M15 16v4',
        },
      ],
    },
    {
      titre: 'Ventes & SAV',
      liens: [
        {
          chemin: '/admin/commandes',
          libelle: 'Commandes',
          icone: 'M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01',
        },
        {
          chemin: '/admin/demandes',
          libelle: 'Dépannages',
          icone: 'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.5-.7-.7-2.5 2.7-2.3z',
        },
        {
          chemin: '/admin/avis',
          libelle: 'Avis clients',
          icone: 'M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12zM8.5 11h7M8.5 14h4',
        },
        {
          chemin: '/admin/prestations',
          libelle: 'Prestations',
          icone: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z',
        },
        {
          chemin: '/admin/techniciens',
          libelle: 'Techniciens',
          icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
        },
      ],
    },
    {
      titre: 'Gestion',
      liens: [
        {
          chemin: '/admin/utilisateurs',
          libelle: 'Utilisateurs',
          icone: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7M22 21a7 7 0 0 0-5-6.7',
        },
      ],
    },
  ];

  protected readonly icones = {
    site: 'M7 17 17 7M8 7h9v9',
    sortie: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
    menu: 'M4 6h16M4 12h16M4 18h16',
    fermer: 'M6 6l12 12M18 6 6 18',
  };

  protected readonly initiales = computed(() => {
    const nom = this.auth.utilisateur()?.nom_complet ?? '';
    const lettres = nom
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((m) => m[0]!.toUpperCase())
      .join('');
    return lettres || 'A';
  });

  protected readonly titrePage = computed(() => {
    // Recalculé à chaque navigation grâce au signal d'URL ci-dessous.
    const url = this.url();
    const tous = this.sections.flatMap((s) => s.liens);
    const exact = tous.find((l) => l.chemin === url);
    if (exact) return exact.libelle;
    const prefixe = tous
      .filter((l) => l.chemin !== '/admin' && url.startsWith(l.chemin))
      .sort((a, b) => b.chemin.length - a.chemin.length)[0];
    return prefixe?.libelle ?? 'Administration';
  });

  private readonly url = signal(this.routeur.url.split('?')[0]);

  constructor() {
    this.routeur.events.pipe(takeUntilDestroyed()).subscribe(() => this.url.set(this.routeur.url.split('?')[0]));
  }

  protected exact(chemin: string): boolean {
    return chemin === '/admin';
  }
}
