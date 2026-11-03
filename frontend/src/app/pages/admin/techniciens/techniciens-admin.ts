import { Component, OnInit, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';

@Component({
  selector: 'app-techniciens-admin',
  imports: [],
  templateUrl: './techniciens-admin.html',
})
export class TechniciensAdmin implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly techniciens = signal<any[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaireOuvert = signal(false);
  protected readonly editionId = signal<number | null>(null);
  protected readonly envoi = signal(false);

  protected readonly nom = signal('');
  protected readonly telephone = signal('');
  protected readonly specialite = signal('');
  protected readonly actif = signal(true);

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      this.techniciens.set(await this.admin.listerTechniciens());
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected ouvrirCreation(): void {
    this.editionId.set(null);
    this.nom.set('');
    this.telephone.set('');
    this.specialite.set('');
    this.actif.set(true);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }
  protected ouvrirEdition(t: any): void {
    this.editionId.set(t.id);
    this.nom.set(t.nom);
    this.telephone.set(t.telephone ?? '');
    this.specialite.set(t.specialite ?? '');
    this.actif.set(t.actif);
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
      telephone: this.telephone().trim() || null,
      specialite: this.specialite().trim() || null,
      actif: this.actif(),
    };
    try {
      if (this.editionId() != null) await this.admin.modifierTechnicien(this.editionId()!, donnees);
      else await this.admin.creerTechnicien(donnees);
      this.formulaireOuvert.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async supprimer(t: any): Promise<void> {
    if (!confirm(`Supprimer le technicien « ${t.nom} » ?`)) return;
    try {
      await this.admin.supprimerTechnicien(t.id);
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Suppression impossible.');
    }
  }
}
