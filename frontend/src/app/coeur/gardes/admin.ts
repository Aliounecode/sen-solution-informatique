import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthentificationService } from '../services/authentification';

export const gardeAdmin: CanActivateFn = async (_route, etat) => {
  const auth = inject(AuthentificationService);
  const routeur = inject(Router);
  const versConnexion = () =>
    routeur.createUrlTree(['/admin/connexion'], { queryParams: { retour: etat.url } });

  if (!auth.estConnecte()) return versConnexion();
  const utilisateur = await auth.assurerUtilisateur();
  if (!utilisateur) return versConnexion(); // jeton expiré
  return utilisateur.role === 'admin' ? true : routeur.createUrlTree(['/']);
};
