import { Component, OnInit, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { TypeDeProduit } from '../../../coeur/modeles/type-produit';

@Component({
  selector: 'app-admin-types-produits',
  imports: [],
  templateUrl: './types-produits.html',
})
export class AdminTypesProduits implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly types = signal<TypeDeProduit[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaireOuvert = signal(false);
  protected readonly editionId = signal<number | null>(null);
  protected readonly envoi = signal(false);

  protected readonly libelle = signal('');
  protected readonly ordre = signal(0);
  protected readonly actif = signal(true);

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      this.types.set(await this.admin.listerTypes());
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected ouvrirCreation(): void {
    this.editionId.set(null);
    this.libelle.set('');
    this.ordre.set((this.types().at(-1)?.ordre ?? 0) + 1);
    this.actif.set(true);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(type: TypeDeProduit): void {
    this.editionId.set(type.id);
    this.libelle.set(type.libelle);
    this.ordre.set(type.ordre);
    this.actif.set(type.actif);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected fermer(): void {
    this.formulaireOuvert.set(false);
  }

  protected async enregistrer(): Promise<void> {
    if (this.libelle().trim().length < 2) {
      this.erreur.set('Le libellé est requis (2 caractères minimum).');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    const donnees = {
      libelle: this.libelle().trim(),
      ordre: this.ordre(),
      actif: this.actif(),
    };
    try {
      if (this.editionId() != null) {
        await this.admin.modifierType(this.editionId()!, donnees);
      } else {
        await this.admin.creerType(donnees);
      }
      this.formulaireOuvert.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async basculer(type: TypeDeProduit): Promise<void> {
    try {
      await this.admin.modifierType(type.id, { actif: !type.actif });
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Modification impossible.');
    }
  }

  protected async supprimer(type: TypeDeProduit): Promise<void> {
    if (!confirm(`Supprimer le type « ${type.libelle} » ?`)) return;
    try {
      await this.admin.supprimerType(type.id);
      await this.charger();
    } catch (erreur: any) {
      // 409 si des produits utilisent encore ce type
      alert(erreur?.error?.detail ?? 'Suppression impossible.');
    }
  }
}
