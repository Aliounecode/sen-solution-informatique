import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthentificationService } from '../../coeur/services/authentification';
import { PanierService } from '../../coeur/services/panier';
import { CommandeService } from '../../coeur/services/commande';
import { Commande, CommandeCreer, ModeRetrait, MoyenPaiement } from '../../coeur/modeles/commande';
import { Fcfa } from '../../coeur/pipes/fcfa';

@Component({
  selector: 'app-commande',
  imports: [RouterLink, Fcfa],
  templateUrl: './commande.html',
})
export class PageCommande {
  protected readonly panier = inject(PanierService);
  private readonly auth = inject(AuthentificationService);
  private readonly commandeService = inject(CommandeService);

  protected readonly nom = signal('');
  protected readonly telephone = signal('');
  protected readonly email = signal('');
  protected readonly modeRetrait = signal<ModeRetrait>('retrait_boutique');
  protected readonly adresse = signal('');
  protected readonly moyenPaiement = signal<MoyenPaiement | ''>('');
  protected readonly note = signal('');

  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly resultat = signal<Commande | null>(null);

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

  protected async passer(): Promise<void> {
    if (this.panier.articles().length === 0) return;
    if (this.nom().trim().length < 2 || this.telephone().trim().length < 6) {
      this.erreur.set('Nom et téléphone sont requis.');
      return;
    }
    if (this.modeRetrait() === 'livraison' && !this.adresse().trim()) {
      this.erreur.set('Une adresse est requise pour la livraison.');
      return;
    }

    this.envoi.set(true);
    this.erreur.set(null);
    try {
      const donnees: CommandeCreer = {
        nom_client: this.nom().trim(),
        telephone_client: this.telephone().trim(),
        email_client: this.email().trim() || undefined,
        mode_retrait: this.modeRetrait(),
        adresse_livraison: this.modeRetrait() === 'livraison' ? this.adresse().trim() : undefined,
        moyen_paiement: this.moyenPaiement() || undefined,
        note_client: this.note().trim() || undefined,
        lignes: this.panier
          .articles()
          .map((a) => ({ produit_id: a.produit_id, quantite: a.quantite })),
      };
      const commande = await this.commandeService.creer(donnees);
      this.panier.vider();
      this.resultat.set(commande);
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "La commande n'a pas pu être enregistrée.");
    } finally {
      this.envoi.set(false);
    }
  }
}
