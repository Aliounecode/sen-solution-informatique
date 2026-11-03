import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PanierService } from '../../coeur/services/panier';
import { Fcfa } from '../../coeur/pipes/fcfa';

@Component({
  selector: 'app-panier',
  imports: [RouterLink, Fcfa],
  templateUrl: './panier.html',
})
export class Panier {
  protected readonly panier = inject(PanierService);
}
