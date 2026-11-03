import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthentificationService } from '../../coeur/services/authentification';

@Component({
  selector: 'app-connexion',
  imports: [RouterLink],
  templateUrl: './connexion.html',
})
export class Connexion {
  private readonly auth = inject(AuthentificationService);
  private readonly routeur = inject(Router);

  protected readonly email = signal('');
  protected readonly motDePasse = signal('');
  protected readonly voirMdp = signal(false);
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected async connecter(): Promise<void> {
    if (!this.email().trim() || !this.motDePasse()) {
      this.erreur.set('E-mail et mot de passe sont requis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      await this.auth.connexion(this.email().trim(), this.motDePasse());
      const cible = this.auth.estAdmin() ? '/admin' : '/mon-compte';
      this.routeur.navigateByUrl(cible);
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'E-mail ou mot de passe incorrect.');
    } finally {
      this.envoi.set(false);
    }
  }
}
