import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { legal } from '../../coeur/legal';

export type TypeDocument = 'mentions' | 'confidentialite' | 'cgv';

@Component({
  selector: 'app-page-legale',
  imports: [RouterLink],
  templateUrl: './page-legale.html',
})
export class PageLegale {
  /** Fourni par `data: { type: … }` de la route (withComponentInputBinding). */
  readonly type = input.required<TypeDocument>();
  protected readonly l = legal;
}
