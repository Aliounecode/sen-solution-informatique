import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthentificationService } from '../../../coeur/services/authentification';

const MESSAGE_GENERIQUE = 'E-mail ou mot de passe incorrect.';

@Component({
  selector: 'app-connexion-admin',
  imports: [RouterLink],
  templateUrl: './connexion-admin.html',
})
export class ConnexionAdmin {
  private readonly auth = inject(AuthentificationService);
  private readonly routeur = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);

  protected readonly email = signal('');
  protected readonly motDePasse = signal('');
  protected readonly voirMdp = signal(false);
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.meta.addTag({ name: 'robots', content: 'noindex, nofollow' });
    inject(DestroyRef).onDestroy(() => this.meta.removeTag("name='robots'"));

    // Déjà connecté en admin : on renvoie directement vers le back-office.
    if (this.auth.estConnecte()) {
      void this.auth.assurerUtilisateur().then((u) => {
        if (u?.role === 'admin') void this.routeur.navigateByUrl(this._cible());
      });
    }
  }

  protected async connecter(): Promise<void> {
    if (!this.email().trim() || !this.motDePasse()) {
      this.erreur.set('E-mail et mot de passe sont requis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      await this.auth.connexion(this.email().trim(), this.motDePasse());
      if (!this.auth.estAdmin()) {
        // Compte client : pas d'accès ici, et on ne révèle pas que le compte existe.
        this.auth.deconnexion(false);
        this.erreur.set(MESSAGE_GENERIQUE);
        return;
      }
      await this.routeur.navigateByUrl(this._cible());
    } catch (e) {
      this.erreur.set(
        e instanceof HttpErrorResponse && e.status === 429
          ? 'Trop de tentatives. Réessayez dans un instant.'
          : MESSAGE_GENERIQUE,
      );
    } finally {
      this.envoi.set(false);
    }
  }

  /** Page demandée avant la redirection, limitée à l'espace admin (pas de redirection ouverte). */
  private _cible(): string {
    const retour = this.route.snapshot.queryParamMap.get('retour');
    return retour && retour.startsWith('/admin') && !retour.startsWith('/admin/connexion')
      ? retour
      : '/admin';
  }
}
