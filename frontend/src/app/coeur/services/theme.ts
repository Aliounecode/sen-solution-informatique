import { Injectable, computed, effect, signal } from '@angular/core';

export type Theme = 'clair' | 'sombre';
const CLE = 'ssi_theme';

function themeInitial(): Theme {
  try {
    const memorise = localStorage.getItem(CLE);
    if (memorise === 'clair' || memorise === 'sombre') return memorise;
  } catch {
    /* stockage indisponible : on retombe sur le thème par défaut */
  }
  // Thème clair par défaut (le visiteur peut basculer, son choix est mémorisé).
  return 'clair';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(themeInitial());
  readonly estSombre = computed(() => this.theme() === 'sombre');

  constructor() {
    effect(() => {
      const valeur = this.theme();
      try {
        localStorage.setItem(CLE, valeur);
      } catch {
        /* non bloquant */
      }
    });
  }

  basculer(): void {
    this.theme.update((t) => (t === 'sombre' ? 'clair' : 'sombre'));
  }
}
