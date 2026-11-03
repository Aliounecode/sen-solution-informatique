import { Injectable, signal } from '@angular/core';

export type TypeToast = 'succes' | 'erreur' | 'info';

export interface Toast {
  id: number;
  type: TypeToast;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private prochainId = 0;
  readonly toasts = signal<Toast[]>([]);

  succes(message: string): void {
    this._afficher('succes', message);
  }

  erreur(message: string): void {
    this._afficher('erreur', message, 5000);
  }

  info(message: string): void {
    this._afficher('info', message);
  }

  fermer(id: number): void {
    this.toasts.update((liste) => liste.filter((t) => t.id !== id));
  }

  private _afficher(type: TypeToast, message: string, dureeMs = 3500): void {
    const id = ++this.prochainId;
    this.toasts.update((liste) => [...liste.slice(-3), { id, type, message }]);
    setTimeout(() => this.fermer(id), dureeMs);
  }
}
