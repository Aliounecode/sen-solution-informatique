import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { environnement } from '../../../environnements/environnement';

@Component({
  selector: 'app-pied',
  imports: [RouterLink],
  templateUrl: './pied.html',
})
export class Pied {
  protected readonly annee = new Date().getFullYear();
  protected readonly infos = environnement;
  protected readonly lienTel = `tel:${environnement.telephone.replace(/[^\d+]/g, '')}`;
  protected readonly lienWhatsapp = `https://wa.me/${environnement.whatsapp.replace(/\D/g, '')}`;
}
