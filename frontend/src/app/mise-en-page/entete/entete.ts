import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BasculeTheme } from '../../composants/bascule-theme/bascule-theme';
import { environnement } from '../../../environnements/environnement';
import { Categorie } from '../../coeur/modeles/categorie';
import { AuthentificationService } from '../../coeur/services/authentification';
import { CatalogueService } from '../../coeur/services/catalogue';
import { PanierService } from '../../coeur/services/panier';

const parOrdre = (a: Categorie, b: Categorie) => a.ordre - b.ordre || a.nom.localeCompare(b.nom);

@Component({
  selector: 'app-entete',
  imports: [RouterLink, RouterLinkActive, BasculeTheme],
  templateUrl: './entete.html',
  host: { class: 'contents', '(document:keydown.escape)': 'fermerTout()' },
})
export class Entete implements OnInit {
  protected readonly auth = inject(AuthentificationService);
  protected readonly panier = inject(PanierService);
  private readonly catalogue = inject(CatalogueService);
  private readonly routeur = inject(Router);

  protected readonly infos = environnement;
  protected readonly lienTel = `tel:${environnement.telephone.replace(/[^\d+]/g, '')}`;

  protected readonly menuOuvert = signal(false);
  protected readonly categoriesOuvert = signal(false);
  protected readonly recherche = signal('');
  private readonly categories = signal<Categorie[]>([]);

  protected readonly racines = computed(() => {
    const actives = this.categories().filter((c) => c.actif);
    return actives
      .filter((c) => c.parent_id == null)
      .sort(parOrdre)
      .map((racine) => ({
        ...racine,
        enfants: actives.filter((c) => c.parent_id === racine.id).sort(parOrdre),
      }));
  });

  async ngOnInit(): Promise<void> {
    try {
      this.categories.set(await this.catalogue.listerCategories());
    } catch {
      /* le menu reste utilisable sans catégories */
    }
  }

  protected chercher(evenement: Event): void {
    evenement.preventDefault();
    const q = this.recherche().trim();
    this.fermerTout();
    void this.routeur.navigate(['/boutique'], { queryParams: q ? { q } : {} });
  }

  protected fermerTout(): void {
    this.menuOuvert.set(false);
    this.categoriesOuvert.set(false);
  }

  protected deconnexion(): void {
    this.fermerTout();
    this.auth.deconnexion();
  }
}
