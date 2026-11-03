import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthentificationService } from '../../coeur/services/authentification';

interface LienAdmin {
  chemin: string;
  libelle: string;
  icone: string;
}

@Component({
  selector: 'app-disposition-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './disposition-admin.html',
})
export class DispositionAdmin {
  protected readonly auth = inject(AuthentificationService);
  protected readonly menuOuvert = signal(false);

  protected readonly liens: LienAdmin[] = [
    { chemin: '/admin', libelle: 'Tableau de bord', icone: '▤' },
    { chemin: '/admin/produits', libelle: 'Produits', icone: '▧' },
    { chemin: '/admin/categories', libelle: 'Catégories', icone: '❏' },
    { chemin: '/admin/commandes', libelle: 'Commandes', icone: '🛒' },
    { chemin: '/admin/demandes', libelle: 'Dépannages', icone: '🔧' },
    { chemin: '/admin/prestations', libelle: 'Prestations', icone: '✦' },
    { chemin: '/admin/techniciens', libelle: 'Techniciens', icone: '☺' },
    { chemin: '/admin/utilisateurs', libelle: 'Utilisateurs', icone: '☰' },
  ];
}
