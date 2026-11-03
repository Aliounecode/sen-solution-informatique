import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fcfa' })
export class Fcfa implements PipeTransform {
  transform(valeur: number | null | undefined): string {
    if (valeur == null) return '—';
    return valeur.toLocaleString('fr-FR').replace(/\u202f/g, ' ') + ' FCFA';
  }
}
