import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthentificationService } from '../services/authentification';

export const gardeAdmin: CanActivateFn = async () => {
  const auth = inject(AuthentificationService);
  const routeur = inject(Router);
  if (!auth.estConnecte()) return routeur.createUrlTree(['/connexion']);
  const utilisateur = await auth.assurerUtilisateur();
  return utilisateur?.role === 'admin' ? true : routeur.createUrlTree(['/']);
};
