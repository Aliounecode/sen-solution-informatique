import { Component, inject } from '@angular/core';

import { NotificationService } from '../../coeur/services/notifications';

@Component({
  selector: 'app-toasts',
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 top-20 z-[60] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-80"
      role="status"
      aria-live="polite"
    >
      @for (t of notifications.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start justify-between gap-3 border-2 bg-surface px-4 py-3 font-corps text-sm shadow-lg"
          [class.border-vert]="t.type === 'succes'"
          [class.border-orange]="t.type === 'erreur'"
          [class.border-cyan]="t.type === 'info'"
        >
          <span>
            <span
              class="mr-1 font-mono"
              [class.text-vert]="t.type === 'succes'"
              [class.text-orange]="t.type === 'erreur'"
              [class.text-cyan]="t.type === 'info'"
              >{{ t.type === 'succes' ? '✓' : t.type === 'erreur' ? '!' : 'i' }}</span
            >
            {{ t.message }}
          </span>
          <button
            type="button"
            (click)="notifications.fermer(t.id)"
            aria-label="Fermer"
            class="text-encre-attenue hover:text-encre"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly notifications = inject(NotificationService);
}
