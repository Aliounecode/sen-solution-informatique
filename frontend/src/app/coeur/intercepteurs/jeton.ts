import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, from, switchMap, throwError } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { AuthentificationService } from '../services/authentification';

const CLE_ACCES = 'ssi_acces';
const CLE_RAFRAICHISSEMENT = 'ssi_refresh';

/** Routes d'authentification où un 401 est une vraie erreur (mauvais mot de passe…), pas une expiration. */
const ROUTES_PUBLIQUES = ['/auth/connexion', '/auth/inscription', '/auth/rafraichir'];

/** Un seul renouvellement à la fois, même si plusieurs requêtes échouent en même temps. */
let renouvellementEnCours: Promise<string> | null = null;

interface JetonsRecus {
  token_acces: string;
  token_rafraichissement: string;
}

function renouveler(backend: HttpBackend, jetonRafraichissement: string): Promise<string> {
  if (!renouvellementEnCours) {
    // HttpClient bâti sur HttpBackend : ne repasse pas par cet intercepteur (pas de boucle).
    const http = new HttpClient(backend);
    renouvellementEnCours = firstValueFrom(
      http.post<JetonsRecus>(`${environnement.urlApi}/auth/rafraichir`, {
        token_rafraichissement: jetonRafraichissement,
      }),
    )
      .then((jetons) => {
        localStorage.setItem(CLE_ACCES, jetons.token_acces);
        localStorage.setItem(CLE_RAFRAICHISSEMENT, jetons.token_rafraichissement);
        return jetons.token_acces;
      })
      .finally(() => {
        renouvellementEnCours = null;
      });
  }
  return renouvellementEnCours;
}

function avecJeton(requete: HttpRequest<unknown>, jeton: string | null): HttpRequest<unknown> {
  return jeton ? requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }) : requete;
}

export const jetonIntercepteur: HttpInterceptorFn = (requete, suivant) => {
  // IMPORTANT : on n'injecte PAS AuthentificationService ici directement.
  // Ce service envoie une requête dans son constructeur : l'injecter ici créerait
  // une dépendance circulaire. On le demande seulement quand on en a besoin (injecteur paresseux).
  const injecteur = inject(Injector);
  const backend = inject(HttpBackend);

  const jeton = localStorage.getItem(CLE_ACCES);

  const sessionExpiree = () => {
    const auth = injecteur.get(AuthentificationService);
    const routeur = injecteur.get(Router);
    auth.deconnexion(false);
    const url = routeur.url;
    const admin = url.startsWith('/admin');
    void routeur.navigate([admin ? '/admin/connexion' : '/connexion'], {
      queryParams: admin ? {} : { retour: url },
    });
  };

  return suivant(avecJeton(requete, jeton)).pipe(
    catchError((erreur: unknown) => {
      const expire =
        erreur instanceof HttpErrorResponse &&
        erreur.status === 401 &&
        !!jeton &&
        !ROUTES_PUBLIQUES.some((route) => requete.url.includes(route));

      if (!expire) {
        return throwError(() => erreur);
      }

      const jetonRafraichissement = localStorage.getItem(CLE_RAFRAICHISSEMENT);
      if (!jetonRafraichissement) {
        sessionExpiree();
        return throwError(() => erreur);
      }

      return from(renouveler(backend, jetonRafraichissement)).pipe(
        // Renouvellement impossible (refresh expiré ou invalide) : vraie déconnexion.
        catchError(() => {
          sessionExpiree();
          return throwError(() => erreur);
        }),
        // Renouvellement réussi : on rejoue la requête avec le nouveau jeton.
        switchMap((nouveauJeton) => suivant(avecJeton(requete, nouveauJeton))),
      );
    }),
  );
};
