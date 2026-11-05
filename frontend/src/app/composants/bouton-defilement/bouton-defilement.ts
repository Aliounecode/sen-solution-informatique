import { Component, signal } from '@angular/core';

const CIRCONFERENCE = 2 * Math.PI * 19;

@Component({
  selector: 'app-bouton-defilement',
  host: { '(window:scroll)': 'mettreAJour()', '(window:resize)': 'mettreAJour()' },
  template: `
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-cyan"
      [style.transform]="'scaleX(' + progression() + ')'"
      aria-hidden="true"
    ></div>

    <button
      type="button"
      (click)="cliquer()"
      [attr.aria-label]="enBas() ? 'Remonter en haut de la page' : 'Descendre dans la page'"
      class="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-bordure bg-surface text-cyan shadow-lg transition duration-300 hover:border-cyan"
      [class.opacity-0]="!visible()"
      [class.pointer-events-none]="!visible()"
      [class.translate-y-4]="!visible()"
    >
      <svg class="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r="19"
          fill="none"
          stroke="currentColor"
          stroke-opacity="0.15"
          stroke-width="3"
        />
        <circle
          cx="22"
          cy="22"
          r="19"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circonference"
          [attr.stroke-dashoffset]="circonference * (1 - progression())"
          class="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <svg
        class="relative h-5 w-5 transition-transform duration-300"
        [class.rotate-180]="enBas()"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </button>
  `,
})
export class BoutonDefilement {
  protected readonly circonference = CIRCONFERENCE;
  protected readonly progression = signal(0);
  protected readonly visible = signal(false);
  protected readonly enBas = signal(false);

  constructor() {
    this.mettreAJour();
  }

  protected mettreAJour(): void {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    const progression = maximum > 0 ? Math.min(1, Math.max(0, y / maximum)) : 0;
    this.progression.set(progression);
    this.visible.set(y > 120 && maximum > 200);
    this.enBas.set(progression >= 0.96);
  }

  protected cliquer(): void {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const comportement: ScrollBehavior = reduit ? 'auto' : 'smooth';
    if (this.enBas()) {
      window.scrollTo({ top: 0, behavior: comportement });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: comportement });
    }
  }
}
