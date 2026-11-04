import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BoutonWhatsapp } from '../../composants/bouton-whatsapp/bouton-whatsapp';
import { Chatbot } from '../../composants/chatbot/chatbot';
import { Toasts } from '../../composants/toasts/toasts';
import { Entete } from '../entete/entete';
import { Pied } from '../pied/pied';

@Component({
  selector: 'app-disposition-publique',
  imports: [RouterOutlet, Entete, Pied, Chatbot, Toasts, BoutonWhatsapp],
  templateUrl: './disposition-publique.html',
})
export class DispositionPublique {}
