import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { retourSecurise } from '../../coeur/retour';
import { AuthentificationService } from '../../coeur/services/authentification';

@Component({
  selector: 'app-inscription',
  imports: [RouterLink],
  templateUrl: './inscription.html',
})
export class Inscription {
  private readonly auth = inject(AuthentificationService);
  private readonly routeur = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly retour = retourSecurise(this.route.snapshot.queryParamMap.get('retour'));

  protected readonly nom = signal('');
  protected readonly email = signal('');
  protected readonly telephone = signal('');
  protected readonly motDePasse = signal('');
  protected readonly voirMdp = signal(false);
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected async inscrire(): Promise<void> {
    if (this.nom().trim().length < 2) {
      this.erreur.set('Votre nom complet est requis.');
      return;
    }
    if (!this.email().trim()) {
      this.erreur.set('Un e-mail valide est requis.');
      return;
    }
    if (this.motDePasse().length < 8) {
      this.erreur.set('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    this.envoi.set(true);
    this.erreur.set(null);
    try {
      await this.auth.inscription({
        nom_complet: this.nom().trim(),
        email: this.email().trim(),
        telephone: this.telephone().trim() || null,
        mot_de_passe: this.motDePasse(),
      });
      await this.auth.connexion(this.email().trim(), this.motDePasse());
      this.routeur.navigateByUrl(this.retour ?? '/mon-compte');
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "L'inscription a échoué.");
    } finally {
      this.envoi.set(false);
    }
  }
}
