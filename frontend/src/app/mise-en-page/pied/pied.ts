import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pied',
  imports: [RouterLink],
  templateUrl: './pied.html',
})
export class Pied {
  protected readonly annee = new Date().getFullYear();
}
