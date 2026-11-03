import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { Categorie } from '../../../coeur/modeles/categorie';

@Component({
  selector: 'app-admin-categories',
  imports: [],
  templateUrl: './categories.html',
})
export class AdminCategories implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly categories = signal<Categorie[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  // Édition inline (null = création)
  protected readonly editionId = signal<number | null>(null);
  protected readonly formulaireOuvert = signal(false);
  protected readonly nom = signal('');
  protected readonly parentId = signal<number | null>(null);
  protected readonly ordre = signal(0);
  protected readonly actif = signal(true);
  protected readonly envoi = signal(false);

  // Parents possibles = toutes les catégories sauf celle en cours d'édition
  protected readonly parentsPossibles = computed(() =>
    this.categories().filter((c) => c.id !== this.editionId()),
  );

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      this.categories.set(await this.admin.listerCategories());
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected nomParent(id: number | null): string {
    if (id == null) return '—';
    return this.categories().find((c) => c.id === id)?.nom ?? '—';
  }

  protected ouvrirCreation(): void {
    this.editionId.set(null);
    this.nom.set('');
    this.parentId.set(null);
    this.ordre.set(0);
    this.actif.set(true);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(categorie: Categorie): void {
    this.editionId.set(categorie.id);
    this.nom.set(categorie.nom);
    this.parentId.set(categorie.parent_id);
    this.ordre.set(categorie.ordre);
    this.actif.set(categorie.actif);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected fermer(): void {
    this.formulaireOuvert.set(false);
  }

  protected async enregistrer(): Promise<void> {
    if (this.nom().trim().length < 2) {
      this.erreur.set('Le nom est requis (2 caractères min).');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    const donnees = {
      nom: this.nom().trim(),
      parent_id: this.parentId(),
      ordre: this.ordre(),
      actif: this.actif(),
    };
    try {
      if (this.editionId() != null) {
        await this.admin.modifierCategorie(this.editionId()!, donnees);
      } else {
        await this.admin.creerCategorie(donnees);
      }
      this.formulaireOuvert.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async supprimer(categorie: Categorie): Promise<void> {
    if (!confirm(`Supprimer la catégorie « ${categorie.nom} » ?`)) return;
    try {
      await this.admin.supprimerCategorie(categorie.id);
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Suppression impossible (catégorie non vide ?).');
    }
  }
}
