import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BoutonDefilement } from '../../composants/bouton-defilement/bouton-defilement';
import { BoutonWhatsapp } from '../../composants/bouton-whatsapp/bouton-whatsapp';
import { Chatbot } from '../../composants/chatbot/chatbot';
import { Toasts } from '../../composants/toasts/toasts';
import { ThemeService } from '../../coeur/services/theme';
import { Entete } from '../entete/entete';
import { Pied } from '../pied/pied';

@Component({
  selector: 'app-disposition-publique',
  imports: [RouterOutlet, Entete, Pied, Chatbot, Toasts, BoutonWhatsapp, BoutonDefilement],
  templateUrl: './disposition-publique.html',
})
export class DispositionPublique {
  protected readonly theme = inject(ThemeService);
}
