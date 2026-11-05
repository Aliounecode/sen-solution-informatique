import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EtapesAchat } from '../../composants/etapes-achat/etapes-achat';
import { PanierService } from '../../coeur/services/panier';
import { Fcfa } from '../../coeur/pipes/fcfa';

@Component({
  selector: 'app-panier',
  imports: [RouterLink, Fcfa, EtapesAchat],
  templateUrl: './panier.html',
})
export class Panier {
  protected readonly panier = inject(PanierService);
}
