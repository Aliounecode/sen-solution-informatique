import { Component, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Avis } from '../../coeur/modeles/avis';
import { AuthentificationService } from '../../coeur/services/authentification';
import { AvisService } from '../../coeur/services/avis';

const PAS = 6;

@Component({
  selector: 'app-section-avis',
  imports: [RouterLink],
  templateUrl: './section-avis.html',
})
export class SectionAvis {
  /** Produit concerné ; null = avis sur la boutique (page d'accueil). */
  readonly produitId = input<number | null>(null);
  readonly titre = input('Avis de nos clients');

  private readonly service = inject(AvisService);
  protected readonly auth = inject(AuthentificationService);
  protected readonly routeur = inject(Router);

  protected readonly etoiles = [1, 2, 3, 4, 5];
  protected readonly Math = Math;
  protected readonly avis = signal<Avis[]>([]);
  protected readonly total = signal(0);
  protected readonly moyenne = signal<number | null>(null);
  protected readonly chargement = signal(true);
  protected readonly chargementPlus = signal(false);

  // Formulaire
  protected readonly formulaireOuvert = signal(false);
  protected readonly note = signal(0);
  protected readonly survol = signal(0);
  protected readonly commentaire = signal('');
  protected readonly nom = linkedSignal(() => this.auth.utilisateur()?.nom_complet ?? '');
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.produitId();
      void this._charger(id);
    });
  }

  private async _charger(id: number | null): Promise<void> {
    this.chargement.set(true);
    this.confirmation.set(null);
    this.formulaireOuvert.set(false);
    try {
      const page = await this.service.lister(id, PAS, 0);
      this.avis.set(page.elements);
      this.total.set(page.total);
      this.moyenne.set(page.moyenne);
    } catch {
      this.avis.set([]);
      this.total.set(0);
      this.moyenne.set(null);
    } finally {
      this.chargement.set(false);
    }
  }

  protected async voirPlus(): Promise<void> {
    this.chargementPlus.set(true);
    try {
      const page = await this.service.lister(this.produitId(), PAS, this.avis().length);
      this.avis.update((liste) => [...liste, ...page.elements]);
      this.total.set(page.total);
    } finally {
      this.chargementPlus.set(false);
    }
  }

  protected ouvrirFormulaire(): void {
    this.erreur.set(null);
    this.confirmation.set(null);
    this.formulaireOuvert.set(true);
  }

  protected async envoyer(): Promise<void> {
    if (this.note() < 1) {
      this.erreur.set('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    if (this.commentaire().trim().length < 5) {
      this.erreur.set('Écrivez quelques mots sur votre expérience (5 caractères minimum).');
      return;
    }
    if (this.nom().trim().length < 2) {
      this.erreur.set('Indiquez le nom à afficher avec votre avis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      const reponse = await this.service.deposer({
        produit_id: this.produitId(),
        note: this.note(),
        commentaire: this.commentaire().trim(),
        nom_affiche: this.nom().trim(),
      });
      this.confirmation.set(reponse.message);
      this.formulaireOuvert.set(false);
      this.note.set(0);
      this.commentaire.set('');
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "Impossible d'envoyer votre avis pour le moment.");
    } finally {
      this.envoi.set(false);
    }
  }

  protected initiales(nom: string): string {
    return (
      nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((m) => m[0]!.toUpperCase())
        .join('') || '?'
    );
  }

  protected date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}
