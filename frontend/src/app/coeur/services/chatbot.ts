import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { MessageChat, ReponseChat } from '../modeles/chatbot';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  envoyer(messages: MessageChat[]): Promise<ReponseChat> {
    return firstValueFrom(this.http.post<ReponseChat>(`${this.base}/chatbot`, { messages }));
  }
}
