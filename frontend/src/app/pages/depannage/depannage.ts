import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DepannageService } from '../../coeur/services/depannage';
import { Prestation } from '../../coeur/modeles/depannage';
import { Fcfa } from '../../coeur/pipes/fcfa';
import { environnement } from '../../../environnements/environnement';

@Component({
  selector: 'app-depannage',
  imports: [RouterLink, Fcfa],
  templateUrl: './depannage.html',
})
export class Depannage implements OnInit {
  private readonly service = inject(DepannageService);

  protected readonly urlVideo = environnement.urlVideoDepannage;
  protected readonly urlPoster = environnement.urlPosterDepannage;

  protected readonly prestations = signal<Prestation[]>([]);
  protected readonly chargement = signal(true);

  async ngOnInit(): Promise<void> {
    try {
      this.prestations.set(await this.service.listerPrestations());
    } catch {
      /* liste non bloquante */
    } finally {
      this.chargement.set(false);
    }
  }
}
