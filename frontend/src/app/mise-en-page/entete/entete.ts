import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthentificationService } from '../../coeur/services/authentification';
import { PanierService } from '../../coeur/services/panier';

@Component({
  selector: 'app-entete',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './entete.html',
})
export class Entete {
  protected readonly auth = inject(AuthentificationService);
  protected readonly panier = inject(PanierService);
  protected readonly menuOuvert = signal(false);

  protected fermerMenu(): void {
    this.menuOuvert.set(false);
  }

  protected deconnexion(): void {
    this.fermerMenu();
    this.auth.deconnexion();
  }
}
