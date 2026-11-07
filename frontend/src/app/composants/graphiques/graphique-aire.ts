import { Component, computed, input, signal } from '@angular/core';

import { Point, cheminLisse, formaterCourt, graduationsNettes, idUnique } from './outils';

export interface SerieAire {
  nom: string;
  /** Couleur CSS (ex. « var(--adm-c1) » ou « #4f46e5 »). */
  couleur: string;
  valeurs: number[];
}

const LARGEUR = 640;
const MARGE_HAUT = 14;
const MARGE_BAS = 28;
const MARGE_GAUCHE = 46;
const MARGE_DROITE = 14;

@Component({
  selector: 'app-graphique-aire',
  template: `
    <div class="relative w-full" (pointerleave)="survol.set(-1)">
      <svg
        [attr.viewBox]="'0 0 ' + largeur + ' ' + hauteur()"
        class="block h-auto w-full touch-pan-y select-none"
        role="img"
        [attr.aria-label]="description()"
        (pointermove)="surDeplacement($event)"
        (pointerdown)="surDeplacement($event)"
      >
        <defs>
          @for (f of formes(); track f.nom; let i = $index) {
            <linearGradient [attr.id]="idDegrade + '-' + i" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [style.stop-color]="f.couleur" stop-opacity="0.34" />
              <stop offset="100%" [style.stop-color]="f.couleur" stop-opacity="0" />
            </linearGradient>
          }
        </defs>

        <!-- Grille + axe vertical -->
        @for (g of graduations(); track g.valeur) {
          <line class="adm-grille" [attr.x1]="margeGauche" [attr.x2]="largeur - margeDroite" [attr.y1]="g.y" [attr.y2]="g.y" />
          <text class="adm-axe" text-anchor="end" [attr.x]="margeGauche - 8" [attr.y]="g.y + 4">{{ afficher(g.valeur) }}</text>
        }

        <!-- Axe horizontal -->
        @for (e of etiquettesVisibles(); track e.index) {
          <text class="adm-axe" text-anchor="middle" [attr.x]="e.x" [attr.y]="hauteur() - 8">{{ e.texte }}</text>
        }

        <!-- Séries -->
        @for (f of formes(); track f.nom; let i = $index) {
          <path [attr.d]="f.aire" [attr.fill]="'url(#' + idDegrade + '-' + i + ')'" />
          <path
            class="adm-ligne-animee"
            pathLength="1"
            [attr.d]="f.ligne"
            fill="none"
            [style.stroke]="f.couleur"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        }

        <!-- Repère de survol -->
        @if (survol() >= 0) {
          <line
            [attr.x1]="abscisse(survol())"
            [attr.x2]="abscisse(survol())"
            [attr.y1]="margeHaut"
            [attr.y2]="hauteur() - margeBas"
            stroke="currentColor"
            stroke-opacity="0.25"
            stroke-dasharray="4 4"
          />
          @for (f of formes(); track f.nom) {
            <circle [attr.cx]="f.points[survol()].x" [attr.cy]="f.points[survol()].y" r="5" class="fill-surface" [style.stroke]="f.couleur" stroke-width="2.5" />
          }
        }
      </svg>

      @if (survol() >= 0) {
        <div class="adm-bulle" [style.left.%]="positionBulle(survol())">
          <p class="mb-1 font-semibold">{{ etiquettes()[survol()] }}</p>
          @for (s of series(); track s.nom) {
            <p class="flex items-center justify-between gap-4">
              <span class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full" [style.background]="s.couleur"></span>{{ s.nom }}
              </span>
              <span class="font-semibold">{{ valeurBulle(s.valeurs[survol()] ?? 0) }}</span>
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class GraphiqueAire {
  readonly etiquettes = input.required<string[]>();
  readonly series = input.required<SerieAire[]>();
  readonly hauteur = input(260);
  /** Format des graduations (court) — par défaut « 45 k ». */
  readonly formatAxe = input<(n: number) => string>(formaterCourt);
  /** Format de l'infobulle (complet) — par défaut identique à l'axe. */
  readonly formatBulle = input<(n: number) => string>((n) => n.toLocaleString('fr-FR'));
  readonly description = input('Graphique en aires');

  protected readonly largeur = LARGEUR;
  protected readonly margeHaut = MARGE_HAUT;
  protected readonly margeBas = MARGE_BAS;
  protected readonly margeGauche = MARGE_GAUCHE;
  protected readonly margeDroite = MARGE_DROITE;
  protected readonly idDegrade = idUnique('adm-aire');

  /** Index survolé, -1 si aucun. */
  protected readonly survol = signal(-1);

  private readonly maximum = computed(() => {
    const tous = this.series().flatMap((s) => s.valeurs);
    const max = tous.length ? Math.max(...tous) : 0;
    const graduations = graduationsNettes(max);
    return graduations[graduations.length - 1] || 1;
  });

  private y(valeur: number): number {
    const h = this.hauteur() - MARGE_HAUT - MARGE_BAS;
    return MARGE_HAUT + h * (1 - valeur / this.maximum());
  }

  protected abscisse(index: number): number {
    const n = this.etiquettes().length;
    if (n <= 1) return MARGE_GAUCHE + (LARGEUR - MARGE_GAUCHE - MARGE_DROITE) / 2;
    return MARGE_GAUCHE + (index * (LARGEUR - MARGE_GAUCHE - MARGE_DROITE)) / (n - 1);
  }

  protected readonly graduations = computed(() =>
    graduationsNettes(Math.max(0, ...this.series().flatMap((s) => s.valeurs))).map((valeur) => ({
      valeur,
      y: this.y(valeur),
    })),
  );

  protected readonly formes = computed(() => {
    const base = this.hauteur() - MARGE_BAS;
    return this.series().map((s) => {
      const points: Point[] = s.valeurs.map((v, i) => ({ x: this.abscisse(i), y: this.y(v) }));
      const ligne = cheminLisse(points);
      const aire =
        points.length > 1
          ? `${ligne} L${points[points.length - 1].x},${base} L${points[0].x},${base} Z`
          : '';
      return { nom: s.nom, couleur: s.couleur, points, ligne, aire };
    });
  });

  protected readonly etiquettesVisibles = computed(() => {
    const noms = this.etiquettes();
    const pas = Math.max(1, Math.ceil(noms.length / 7));
    return noms
      .map((texte, index) => ({ texte, index, x: this.abscisse(index) }))
      .filter((e) => e.index % pas === 0);
  });

  protected afficher(n: number): string {
    return this.formatAxe()(n);
  }

  protected valeurBulle(n: number): string {
    return this.formatBulle()(n);
  }

  protected positionBulle(index: number): number {
    const pct = (this.abscisse(index) / LARGEUR) * 100;
    return Math.min(86, Math.max(14, pct));
  }

  protected surDeplacement(evenement: PointerEvent): void {
    const n = this.etiquettes().length;
    if (n === 0) return;
    const boite = (evenement.currentTarget as SVGSVGElement).getBoundingClientRect();
    if (!boite.width) return;
    const x = ((evenement.clientX - boite.left) / boite.width) * LARGEUR;
    const pas = n > 1 ? (LARGEUR - MARGE_GAUCHE - MARGE_DROITE) / (n - 1) : 0;
    const index = n > 1 ? Math.round((x - MARGE_GAUCHE) / pas) : 0;
    this.survol.set(Math.max(0, Math.min(n - 1, index)));
  }
}
