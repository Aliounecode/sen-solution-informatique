import { Component, computed, input } from '@angular/core';

import { Point, cheminLisse, idUnique } from './outils';

const L = 100;
const H = 32;

/** Petite courbe de tendance (sparkline) sans axes, pour les cartes de chiffres clés. */
@Component({
  selector: 'app-mini-courbe',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + largeur + ' ' + hauteur"
      preserveAspectRatio="none"
      class="block h-10 w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient [attr.id]="idDegrade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [style.stop-color]="couleur()" stop-opacity="0.3" />
          <stop offset="100%" [style.stop-color]="couleur()" stop-opacity="0" />
        </linearGradient>
      </defs>
      @if (formes().aire) {
        <path [attr.d]="formes().aire" [attr.fill]="'url(#' + idDegrade + ')'" />
      }
      <path
        [attr.d]="formes().ligne"
        fill="none"
        [style.stroke]="couleur()"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class MiniCourbe {
  readonly valeurs = input.required<number[]>();
  readonly couleur = input('var(--adm-c1)');

  protected readonly largeur = L;
  protected readonly hauteur = H;
  protected readonly idDegrade = idUnique('adm-mini');

  protected readonly formes = computed(() => {
    const v = this.valeurs();
    if (v.length < 2) return { ligne: '', aire: '' };
    const max = Math.max(...v);
    const min = Math.min(...v);
    const ecart = max - min || 1;
    const points: Point[] = v.map((valeur, i) => ({
      x: (i * L) / (v.length - 1),
      y: 3 + (H - 6) * (1 - (valeur - min) / ecart),
    }));
    const ligne = cheminLisse(points);
    return { ligne, aire: `${ligne} L${L},${H} L0,${H} Z` };
  });
}
