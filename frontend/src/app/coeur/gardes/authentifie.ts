import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthentificationService } from '../services/authentification';

export const gardeAuthentifie: CanActivateFn = (_route, etat) => {
  const auth = inject(AuthentificationService);
  const routeur = inject(Router);
  return auth.estConnecte()
    ? true
    : routeur.createUrlTree(['/connexion'], { queryParams: { retour: etat.url } });
};
