import { Component, computed, input, signal } from '@angular/core';

export interface PartDonut {
  libelle: string;
  valeur: number;
  /** Couleur CSS (ex. « var(--adm-c1) »). */
  couleur: string;
}

const RAYON = 70;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

@Component({
  selector: 'app-graphique-donut',
  template: `
    <div class="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div class="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 180 180" class="h-full w-full -rotate-90" role="img" [attr.aria-label]="description()">
          <circle cx="90" cy="90" [attr.r]="rayon" fill="none" stroke="var(--color-surface-2)" stroke-width="20" />
          @for (a of arcs(); track a.libelle) {
            <circle
              cx="90"
              cy="90"
              [attr.r]="rayon"
              fill="none"
              stroke-width="20"
              class="cursor-pointer transition-all duration-300"
              [style.stroke]="a.couleur"
              [attr.stroke-dasharray]="a.longueur + ' ' + circonference"
              [attr.stroke-dashoffset]="-a.debut"
              [style.opacity]="actif() === null || actif() === a.index ? 1 : 0.3"
              [attr.stroke-width]="actif() === a.index ? 24 : 20"
              (pointerenter)="actif.set(a.index)"
              (pointerleave)="actif.set(null)"
            />
          }
        </svg>
        <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          @if (partActive(); as p) {
            <span class="font-display text-2xl font-bold" [style.color]="p.couleur">{{ p.valeur }}</span>
            <span class="max-w-[7rem] truncate text-xs text-encre-attenue">{{ p.libelle }}</span>
          } @else {
            <span class="font-display text-3xl font-bold">{{ valeurCentre() ?? total() }}</span>
            <span class="text-xs text-encre-attenue">{{ titreCentre() }}</span>
          }
        </div>
      </div>

      <ul class="w-full min-w-0 flex-1 space-y-2">
        @for (p of parts(); track p.libelle; let i = $index) {
          <li
            class="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition"
            [class.bg-surface-2]="actif() === i"
            (pointerenter)="actif.set(i)"
            (pointerleave)="actif.set(null)"
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.background]="p.couleur"></span>
              <span class="truncate text-encre-attenue">{{ p.libelle }}</span>
            </span>
            <span class="shrink-0 font-semibold">
              {{ p.valeur }}
              <span class="ml-1 text-xs font-normal text-encre-attenue">{{ pourcentage(p.valeur) }}</span>
            </span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class GraphiqueDonut {
  readonly parts = input.required<PartDonut[]>();
  readonly titreCentre = input('total');
  /** Texte central personnalisé (sinon : somme des parts). */
  readonly valeurCentre = input<string | null>(null);
  readonly description = input('Graphique en anneau');

  protected readonly rayon = RAYON;
  protected readonly circonference = CIRCONFERENCE;
  protected readonly actif = signal<number | null>(null);

  protected readonly total = computed(() => this.parts().reduce((somme, p) => somme + p.valeur, 0));

  protected readonly partActive = computed(() => {
    const i = this.actif();
    return i === null ? null : (this.parts()[i] ?? null);
  });

  protected readonly arcs = computed(() => {
    const total = this.total();
    if (total <= 0) return [];
    const visibles = this.parts().filter((p) => p.valeur > 0).length;
    const interstice = visibles > 1 ? 3 : 0;
    let cumul = 0;
    const resultat: { libelle: string; couleur: string; index: number; debut: number; longueur: number }[] = [];
    this.parts().forEach((p, index) => {
      if (p.valeur <= 0) return;
      const part = (p.valeur / total) * CIRCONFERENCE;
      resultat.push({
        libelle: p.libelle,
        couleur: p.couleur,
        index,
        debut: cumul,
        longueur: Math.max(part - interstice, 0.5),
      });
      cumul += part;
    });
    return resultat;
  });

  protected pourcentage(valeur: number): string {
    const total = this.total();
    return total > 0 ? `${Math.round((valeur / total) * 100)} %` : '0 %';
  }
}
