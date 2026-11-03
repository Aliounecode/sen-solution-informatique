import { Component, OnInit, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { Fcfa } from '../../../coeur/pipes/fcfa';

@Component({
  selector: 'app-prestations-admin',
  imports: [Fcfa],
  templateUrl: './prestations-admin.html',
})
export class PrestationsAdmin implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly prestations = signal<any[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaireOuvert = signal(false);
  protected readonly editionId = signal<number | null>(null);
  protected readonly envoi = signal(false);

  protected readonly nom = signal('');
  protected readonly description = signal('');
  protected readonly tarif = signal<number | null>(null);
  protected readonly dureeEstimee = signal('');
  protected readonly ordre = signal(0);
  protected readonly actif = signal(true);

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      this.prestations.set(await this.admin.listerPrestationsAdmin());
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected ouvrirCreation(): void {
    this.editionId.set(null);
    this.nom.set('');
    this.description.set('');
    this.tarif.set(null);
    this.dureeEstimee.set('');
    this.ordre.set(0);
    this.actif.set(true);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(p: any): void {
    this.editionId.set(p.id);
    this.nom.set(p.nom);
    this.description.set(p.description ?? '');
    this.tarif.set(p.tarif);
    this.dureeEstimee.set(p.duree_estimee ?? '');
    this.ordre.set(p.ordre);
    this.actif.set(p.actif);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected fermer(): void {
    this.formulaireOuvert.set(false);
  }

  protected async enregistrer(): Promise<void> {
    if (this.nom().trim().length < 2) {
      this.erreur.set('Le nom est requis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    const donnees = {
      nom: this.nom().trim(),
      description: this.description().trim() || null,
      tarif: this.tarif(),
      duree_estimee: this.dureeEstimee().trim() || null,
      ordre: this.ordre(),
      actif: this.actif(),
    };
    try {
      if (this.editionId() != null) await this.admin.modifierPrestation(this.editionId()!, donnees);
      else await this.admin.creerPrestation(donnees);
      this.formulaireOuvert.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async supprimer(p: any): Promise<void> {
    if (!confirm(`Supprimer la prestation « ${p.nom} » ?`)) return;
    try {
      await this.admin.supprimerPrestation(p.id);
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Suppression impossible.');
    }
  }
}
