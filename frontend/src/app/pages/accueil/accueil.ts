import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogueService } from '../../coeur/services/catalogue';
import { ProduitResume } from '../../coeur/modeles/produit';
import { CarteProduit } from '../../composants/carte-produit/carte-produit';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, CarteProduit],
  templateUrl: './accueil.html',
})
export class Accueil implements OnInit {
  private readonly catalogue = inject(CatalogueService);
  protected readonly vedettes = signal<ProduitResume[]>([]);

  async ngOnInit(): Promise<void> {
    try {
      const page = await this.catalogue.listerProduits({ en_vedette: true, taille: 4 });
      this.vedettes.set(page.elements);
    } catch {
      /* non bloquant */
    }
  }
}
