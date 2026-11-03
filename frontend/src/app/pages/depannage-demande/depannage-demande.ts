import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthentificationService } from '../../coeur/services/authentification';
import { DepannageService } from '../../coeur/services/depannage';
import { Demande, DemandeCreer, Prestation } from '../../coeur/modeles/depannage';

@Component({
  selector: 'app-depannage-demande',
  imports: [RouterLink],
  templateUrl: './depannage-demande.html',
})
export class DepannageDemande implements OnInit {
  private readonly service = inject(DepannageService);
  private readonly auth = inject(AuthentificationService);

  protected readonly prestations = signal<Prestation[]>([]);

  protected readonly nom = signal('');
  protected readonly telephone = signal('');
  protected readonly email = signal('');
  protected readonly typeAppareil = signal('');
  protected readonly marque = signal('');
  protected readonly modele = signal('');
  protected readonly description = signal('');
  protected readonly prestationId = signal<number | null>(null);

  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly resultat = signal<Demande | null>(null);

  constructor() {
    effect(() => {
      const utilisateur = this.auth.utilisateur();
      if (utilisateur) {
        if (!this.nom()) this.nom.set(utilisateur.nom_complet);
        if (!this.email() && utilisateur.email) this.email.set(utilisateur.email);
        if (!this.telephone() && utilisateur.telephone) this.telephone.set(utilisateur.telephone);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      this.prestations.set(await this.service.listerPrestations());
    } catch {
      /* non bloquant */
    }
  }

  protected async envoyer(): Promise<void> {
    if (
      this.nom().trim().length < 2 ||
      this.telephone().trim().length < 6 ||
      this.typeAppareil().trim().length < 2 ||
      this.description().trim().length < 5
    ) {
      this.erreur.set('Nom, téléphone, type d’appareil et description de la panne sont requis.');
      return;
    }

    this.envoi.set(true);
    this.erreur.set(null);
    try {
      const donnees: DemandeCreer = {
        nom_client: this.nom().trim(),
        telephone_client: this.telephone().trim(),
        email_client: this.email().trim() || undefined,
        type_appareil: this.typeAppareil().trim(),
        marque_appareil: this.marque().trim() || undefined,
        modele_appareil: this.modele().trim() || undefined,
        description_panne: this.description().trim(),
        prestation_id: this.prestationId() ?? undefined,
      };
      this.resultat.set(await this.service.creerDemande(donnees));
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "La demande n'a pas pu être enregistrée.");
    } finally {
      this.envoi.set(false);
    }
  }
}
