import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { CatalogueService, FiltresProduits } from '../../coeur/services/catalogue';
import { Categorie } from '../../coeur/modeles/categorie';
import { ProduitResume, TypeProduit } from '../../coeur/modeles/produit';
import { CarteProduit } from '../../composants/carte-produit/carte-produit';

@Component({
  selector: 'app-boutique',
  imports: [CarteProduit],
  templateUrl: './boutique.html',
})
export class Boutique implements OnInit {
  private readonly catalogue = inject(CatalogueService);

  protected readonly categories = signal<Categorie[]>([]);
  protected readonly produits = signal<ProduitResume[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly recherche = signal('');
  protected readonly categorieId = signal<number | null>(null);
  protected readonly typeProduit = signal<TypeProduit | null>(null);
  protected readonly tri = signal('recent');
  protected readonly page = signal(1);
  protected readonly taille = 12;

  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );

  // Catégories ordonnées en arborescence, avec un libellé indenté pour l'affichage.
  protected readonly categoriesArbre = computed(() => {
    const plates = this.categories();
    const enfantsDe = new Map<number | null, Categorie[]>();
    for (const c of plates) {
      const cle = c.parent_id ?? null;
      if (!enfantsDe.has(cle)) enfantsDe.set(cle, []);
      enfantsDe.get(cle)!.push(c);
    }
    const resultat: { id: number; label: string }[] = [];
    const parcourir = (parentId: number | null, profondeur: number): void => {
      for (const c of enfantsDe.get(parentId) ?? []) {
        const indent = '\u00A0\u00A0'.repeat(profondeur);
        resultat.push({ id: c.id, label: profondeur > 0 ? `${indent}↳ ${c.nom}` : c.nom });
        parcourir(c.id, profondeur + 1);
      }
    };
    parcourir(null, 0);
    return resultat;
  });

  async ngOnInit(): Promise<void> {
    try {
      this.categories.set(await this.catalogue.listerCategories());
    } catch {
      /* liste de catégories non bloquante */
    }
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const filtres: FiltresProduits = {
        recherche: this.recherche() || undefined,
        categorie_id: this.categorieId() ?? undefined,
        type_produit: this.typeProduit() ?? undefined,
        tri: this.tri(),
        page: this.page(),
        taille: this.taille,
      };
      const resultat = await this.catalogue.listerProduits(filtres);
      this.produits.set(resultat.elements);
      this.total.set(resultat.total);
    } catch {
      this.erreur.set('Impossible de charger les produits pour le moment.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected async appliquer(): Promise<void> {
    this.page.set(1);
    await this.charger();
  }

  protected async surCategorie(valeur: string): Promise<void> {
    this.categorieId.set(valeur ? Number(valeur) : null);
    await this.appliquer();
  }

  protected async surType(valeur: string): Promise<void> {
    this.typeProduit.set((valeur || null) as TypeProduit | null);
    await this.appliquer();
  }

  protected async surTri(valeur: string): Promise<void> {
    this.tri.set(valeur);
    await this.appliquer();
  }

  protected async allerPage(cible: number): Promise<void> {
    if (cible < 1 || cible > this.nombrePages()) return;
    this.page.set(cible);
    await this.charger();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
