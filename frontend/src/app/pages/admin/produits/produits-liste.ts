import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdministrationService } from '../../../coeur/services/administration';
import { Categorie } from '../../../coeur/modeles/categorie';
import { ProduitResume } from '../../../coeur/modeles/produit';
import { Fcfa } from '../../../coeur/pipes/fcfa';

@Component({
  selector: 'app-produits-liste',
  imports: [RouterLink, Fcfa],
  templateUrl: './produits-liste.html',
})
export class ProduitsListe implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly produits = signal<ProduitResume[]>([]);
  protected readonly categories = signal<Categorie[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);

  protected readonly recherche = signal('');
  protected readonly categorieId = signal<number | null>(null);
  protected readonly typeProduit = signal<string>('');
  protected readonly page = signal(1);
  protected readonly taille = 20;

  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );

  async ngOnInit(): Promise<void> {
    try {
      this.categories.set(await this.admin.listerCategories());
    } catch {
      /* non bloquant */
    }
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      const resultat = await this.admin.listerProduits({
        recherche: this.recherche() || undefined,
        categorie_id: this.categorieId() ?? undefined,
        type_produit: this.typeProduit() || undefined,
        page: this.page(),
        taille: this.taille,
      });
      this.produits.set(resultat.elements);
      this.total.set(resultat.total);
    } catch {
      this.produits.set([]);
    } finally {
      this.chargement.set(false);
    }
  }

  protected async appliquer(): Promise<void> {
    this.page.set(1);
    await this.charger();
  }

  protected async surCategorie(v: string): Promise<void> {
    this.categorieId.set(v ? Number(v) : null);
    await this.appliquer();
  }

  protected async surType(v: string): Promise<void> {
    this.typeProduit.set(v);
    await this.appliquer();
  }

  protected async allerPage(cible: number): Promise<void> {
    if (cible < 1 || cible > this.nombrePages()) return;
    this.page.set(cible);
    await this.charger();
  }

  protected imagePrincipale(produit: ProduitResume): string | null {
    return (produit.images.find((i) => i.est_principale) ?? produit.images[0])?.url ?? null;
  }

  protected async supprimer(produit: ProduitResume): Promise<void> {
    if (!confirm(`Supprimer « ${produit.nom} » ? Cette action est définitive.`)) return;
    try {
      await this.admin.supprimerProduit(produit.id);
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Suppression impossible.');
    }
  }
}
