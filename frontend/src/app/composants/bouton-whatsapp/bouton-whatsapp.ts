import { Component } from '@angular/core';

import { environnement } from '../../../environnements/environnement';

@Component({
  selector: 'app-bouton-whatsapp',
  template: `
    @if (lien) {
      <a
        [href]="lien"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nous écrire sur WhatsApp"
        class="fixed bottom-20 right-4 z-40 flex items-center gap-2 border-2 border-vert bg-vert px-4 py-3 font-mono text-xs font-bold uppercase tracking-wide text-fond shadow-[4px_4px_0_0_#0a0e12] transition hover:-translate-y-0.5"
      >
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" stroke-linejoin="round" />
        </svg>
        WhatsApp
      </a>
    }
  `,
})
export class BoutonWhatsapp {
  protected readonly lien = environnement.whatsapp
    ? `https://wa.me/${environnement.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
        'Bonjour, je vous contacte depuis le site Sen Solution Informatique.',
      )}`
    : null;
}
