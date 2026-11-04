import { Routes } from '@angular/router';

import { gardeAuthentifie } from './coeur/gardes/authentifie';
import { gardeAdmin } from './coeur/gardes/admin';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./mise-en-page/disposition-publique/disposition-publique').then(
        (m) => m.DispositionPublique,
      ),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/accueil/accueil').then((m) => m.Accueil),
      },
      {
        path: 'boutique',
        loadComponent: () => import('./pages/boutique/boutique').then((m) => m.Boutique),
      },
      {
        path: 'produit/:slug',
        loadComponent: () =>
          import('./pages/produit-detail/produit-detail').then((m) => m.ProduitDetail),
      },
      {
        path: 'panier',
        loadComponent: () => import('./pages/panier/panier').then((m) => m.Panier),
      },
      {
        path: 'commande',
        loadComponent: () => import('./pages/commande/commande').then((m) => m.PageCommande),
      },
      {
        path: 'suivi',
        loadComponent: () => import('./pages/suivi/suivi').then((m) => m.Suivi),
      },
      {
        path: 'depannage',
        loadComponent: () => import('./pages/depannage/depannage').then((m) => m.Depannage),
      },
      {
        path: 'depannage/demande',
        loadComponent: () =>
          import('./pages/depannage-demande/depannage-demande').then((m) => m.DepannageDemande),
      },
      {
        path: 'depannage/suivi',
        loadComponent: () =>
          import('./pages/depannage-suivi/depannage-suivi').then((m) => m.DepannageSuivi),
      },
      {
        path: 'connexion',
        loadComponent: () => import('./pages/connexion/connexion').then((m) => m.Connexion),
      },
      {
        path: 'inscription',
        loadComponent: () => import('./pages/inscription/inscription').then((m) => m.Inscription),
      },
      {
        path: 'mon-compte',
        canActivate: [gardeAuthentifie],
        loadComponent: () => import('./pages/mon-compte/mon-compte').then((m) => m.MonCompte),
      },
    ],
  },
  {
    path: 'admin/connexion',
    loadComponent: () =>
      import('./pages/admin/connexion-admin/connexion-admin').then((m) => m.ConnexionAdmin),
  },
  {
    path: 'admin',
    canActivate: [gardeAdmin],
    loadComponent: () =>
      import('./mise-en-page/disposition-admin/disposition-admin').then((m) => m.DispositionAdmin),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin/tableau-bord/tableau-bord').then((m) => m.TableauBord),
      },
      {
        path: 'produits',
        loadComponent: () =>
          import('./pages/admin/produits/produits-liste').then((m) => m.ProduitsListe),
      },
      {
        path: 'produits/nouveau',
        loadComponent: () =>
          import('./pages/admin/produits/produit-edition').then((m) => m.ProduitEdition),
      },
      {
        path: 'produits/:id',
        loadComponent: () =>
          import('./pages/admin/produits/produit-edition').then((m) => m.ProduitEdition),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/categories/categories').then((m) => m.AdminCategories),
      },
      {
        path: 'specifications',
        loadComponent: () =>
          import('./pages/admin/specifications/specifications').then((m) => m.AdminSpecifications),
      },
      {
        path: 'commandes',
        loadComponent: () =>
          import('./pages/admin/commandes/commandes-admin').then((m) => m.CommandesAdmin),
      },
      {
        path: 'demandes',
        loadComponent: () =>
          import('./pages/admin/demandes/demandes-admin').then((m) => m.DemandesAdmin),
      },
      {
        path: 'prestations',
        loadComponent: () =>
          import('./pages/admin/prestations/prestations-admin').then((m) => m.PrestationsAdmin),
      },
      {
        path: 'techniciens',
        loadComponent: () =>
          import('./pages/admin/techniciens/techniciens-admin').then((m) => m.TechniciensAdmin),
      },
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./pages/admin/utilisateurs/utilisateurs-admin').then((m) => m.UtilisateursAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
