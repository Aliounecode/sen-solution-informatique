import { HttpInterceptorFn } from '@angular/common/http';

export const jetonIntercepteur: HttpInterceptorFn = (requete, suivant) => {
  const jeton = localStorage.getItem('ssi_acces');
  if (jeton) {
    requete = requete.clone({
      setHeaders: { Authorization: `Bearer ${jeton}` },
    });
  }
  return suivant(requete);
};
