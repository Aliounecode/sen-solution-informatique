import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ContactBoutique } from '../../coeur/modeles/chatbot';
import { ProduitResume } from '../../coeur/modeles/produit';
import { Fcfa } from '../../coeur/pipes/fcfa';
import { ChatbotService } from '../../coeur/services/chatbot';

interface EchangeChat {
  role: 'user' | 'assistant';
  contenu: string;
  produits?: ProduitResume[];
  erreur?: boolean;
}

@Component({
  selector: 'app-chatbot',
  imports: [RouterLink, Fcfa],
  templateUrl: './chatbot.html',
})
export class Chatbot {
  private readonly service = inject(ChatbotService);
  private readonly zoneMessages = viewChild<ElementRef<HTMLElement>>('zoneMessages');

  protected readonly ouvert = signal(false);
  protected readonly saisie = signal('');
  protected readonly envoi = signal(false);
  protected readonly contact = signal<ContactBoutique | null>(null);
  protected readonly messages = signal<EchangeChat[]>([
    {
      role: 'assistant',
      contenu:
        "Bonjour 👋 Je suis l'assistant de Sen Solution Informatique. Posez-moi vos questions sur nos produits ou sur le dépannage : je vous réponds tout de suite, même si le gérant n'est pas disponible.",
    },
  ]);

  protected readonly suggestions = [
    'Quels ordinateurs portables avez-vous ?',
    'Je cherche un PC pour le bureau',
    'Comment demander un dépannage ?',
  ];

  protected prix(p: ProduitResume): number {
    return p.promo_active && p.prix_promo != null ? p.prix_promo : p.prix;
  }

  protected image(p: ProduitResume): string | null {
    return (p.images.find((i) => i.est_principale) ?? p.images[0])?.url ?? null;
  }

  protected lienWhatsapp(numero: string): string {
    return `https://wa.me/${numero.replace(/\D/g, '')}`;
  }

  protected lienTelephone(numero: string): string {
    return `tel:${numero.replace(/[^\d+]/g, '')}`;
  }

  protected ouvrir(): void {
    this.ouvert.set(true);
    this._defiler();
  }

  protected fermer(): void {
    this.ouvert.set(false);
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    void this._envoyerTexte(this.saisie());
  }

  protected suggerer(texte: string): void {
    void this._envoyerTexte(texte);
  }

  private async _envoyerTexte(brut: string): Promise<void> {
    const texte = brut.trim().slice(0, 500);
    if (!texte || this.envoi()) return;

    this.messages.update((l) => [...l, { role: 'user', contenu: texte }]);
    this.saisie.set('');
    this.envoi.set(true);
    this._defiler();

    const historique = this.messages()
      .slice(1)
      .filter((m) => !m.erreur)
      .slice(-10)
      .map((m) => ({ role: m.role, contenu: m.contenu.slice(0, 800) }));

    try {
      const reponse = await this.service.envoyer(historique);
      this.contact.set(reponse.contact);
      this.messages.update((l) => [
        ...l,
        { role: 'assistant', contenu: reponse.reponse, produits: reponse.produits },
      ]);
    } catch (e) {
      const trop = e instanceof HttpErrorResponse && e.status === 429;
      this.messages.update((l) => [
        ...l,
        {
          role: 'assistant',
          erreur: true,
          contenu: trop
            ? 'Vous écrivez très vite ! Patientez quelques secondes puis réessayez.'
            : "Je rencontre un souci technique. Contactez directement la boutique, on s'occupe de vous.",
        },
      ]);
    } finally {
      this.envoi.set(false);
      this._defiler();
    }
  }

  private _defiler(): void {
    setTimeout(() => {
      const zone = this.zoneMessages()?.nativeElement;
      if (zone) zone.scrollTop = zone.scrollHeight;
    });
  }
}
