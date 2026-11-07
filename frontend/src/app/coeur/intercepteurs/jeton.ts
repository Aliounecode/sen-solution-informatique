import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthentificationService } from '../services/authentification';

export const jetonIntercepteur: HttpInterceptorFn = (requete, suivant) => {
  const auth = inject(AuthentificationService);
  const routeur = inject(Router);

  const jeton = localStorage.getItem('ssi_acces');
  if (jeton) {
    requete = requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } });
  }

  return suivant(requete).pipe(
    catchError((erreur: unknown) => {
      const sessionExpiree =
        erreur instanceof HttpErrorResponse &&
        erreur.status === 401 &&
        !!jeton &&
        !requete.url.includes('/auth/');
      if (sessionExpiree) {
        auth.deconnexion(false);
        const url = routeur.url;
        const retour = url.startsWith('/admin') ? '/admin/connexion' : '/connexion';
        routeur.navigate([retour], {
          queryParams: url.startsWith('/admin') ? {} : { retour: url },
        });
      }
      return throwError(() => erreur);
    }),
  );
};
