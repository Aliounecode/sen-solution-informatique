import { Component, input } from '@angular/core';

@Component({
  selector: 'app-etapes-achat',
  template: `
    <ol
      class="flex items-center gap-2 font-mono text-xs uppercase tracking-wider"
      aria-label="Étapes de la commande"
    >
      @for (libelle of libelles; track libelle; let i = $index) {
        <li class="flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full border text-[11px]"
            [class.bg-cyan]="i + 1 <= etape()"
            [class.border-cyan]="i + 1 <= etape()"
            [class.text-surface]="i + 1 <= etape()"
            [class.border-bordure]="i + 1 > etape()"
            [class.text-encre-attenue]="i + 1 > etape()"
            >{{ i + 1 < etape() ? '✓' : i + 1 }}</span
          >
          <span
            class="sm:inline"
            [class.hidden]="i + 1 !== etape()"
            [class.text-encre]="i + 1 === etape()"
            [class.text-encre-attenue]="i + 1 !== etape()"
            >{{ libelle }}</span
          >
          @if (i < libelles.length - 1) {
            <span class="h-px w-5 bg-bordure sm:w-10"></span>
          }
        </li>
      }
    </ol>
  `,
})
export class EtapesAchat {
  readonly etape = input.required<number>();
  protected readonly libelles = ['Panier', 'Informations', 'Confirmation'];
}
