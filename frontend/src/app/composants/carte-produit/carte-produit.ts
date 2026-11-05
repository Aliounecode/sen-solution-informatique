import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProduitResume } from '../../coeur/modeles/produit';
import { Fcfa } from '../../coeur/pipes/fcfa';

@Component({
  selector: 'app-carte-produit',
  imports: [RouterLink, Fcfa],
  templateUrl: './carte-produit.html',
})
export class CarteProduit {
  readonly produit = input.required<ProduitResume>();

  readonly image = computed(() => {
    const images = this.produit().images;
    return (images.find((i) => i.est_principale) ?? images[0])?.url ?? null;
  });
  readonly enPromo = computed(
    () => this.produit().promo_active && this.produit().prix_promo != null,
  );
  readonly enRupture = computed(() => this.produit().quantite_stock <= 0);
  readonly reduction = computed(() => {
    const p = this.produit();
    if (!this.enPromo() || p.prix <= 0) return 0;
    return Math.round((1 - (p.prix_promo as number) / p.prix) * 100);
  });
}
