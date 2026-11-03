import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdministrationService } from '../../../coeur/services/administration';
import { AuthentificationService } from '../../../coeur/services/authentification';

@Component({
  selector: 'app-utilisateurs-admin',
  imports: [],
  templateUrl: './utilisateurs-admin.html',
})
export class UtilisateursAdmin implements OnInit {
  private readonly admin = inject(AdministrationService);
  private readonly auth = inject(AuthentificationService);

  protected readonly utilisateurs = signal<any[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(false);
  protected readonly role = signal('');
  protected readonly recherche = signal('');
  protected readonly page = signal(1);
  protected readonly taille = 20;

  protected readonly erreur = signal<string | null>(null);

  // Création
  protected readonly creationOuverte = signal(false);
  protected readonly nvNom = signal('');
  protected readonly nvEmail = signal('');
  protected readonly nvTelephone = signal('');
  protected readonly nvMotDePasse = signal('');
  protected readonly nvRole = signal('client');
  protected readonly envoi = signal(false);

  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );
  protected readonly moiId = computed(() => this.auth.utilisateur()?.id ?? -1);

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      const r = await this.admin.listerUtilisateurs({
        role: this.role() || undefined,
        recherche: this.recherche() || undefined,
        page: this.page(),
        taille: this.taille,
      });
      this.utilisateurs.set(r.elements);
      this.total.set(r.total);
    } finally {
      this.chargement.set(false);
    }
  }

  protected async appliquer(): Promise<void> {
    this.page.set(1);
    await this.charger();
  }
  protected async surRole(v: string): Promise<void> {
    this.role.set(v);
    await this.appliquer();
  }
  protected async allerPage(c: number): Promise<void> {
    if (c < 1 || c > this.nombrePages()) return;
    this.page.set(c);
    await this.charger();
  }

  protected async basculerActif(u: any): Promise<void> {
    this.erreur.set(null);
    try {
      await this.admin.modifierUtilisateur(u.id, { actif: !u.actif });
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Action impossible.');
    }
  }

  protected async changerRole(u: any, role: string): Promise<void> {
    this.erreur.set(null);
    try {
      await this.admin.modifierUtilisateur(u.id, { role });
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Action impossible.');
    }
  }

  protected async reinitialiser(u: any): Promise<void> {
    const nouveau = prompt(`Nouveau mot de passe pour ${u.nom_complet} (8 caractères min.) :`);
    if (!nouveau) return;
    if (nouveau.length < 8) {
      alert('8 caractères minimum.');
      return;
    }
    try {
      await this.admin.reinitialiserMotDePasse(u.id, nouveau);
      alert('Mot de passe réinitialisé.');
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Réinitialisation impossible.');
    }
  }

  protected ouvrirCreation(): void {
    this.nvNom.set('');
    this.nvEmail.set('');
    this.nvTelephone.set('');
    this.nvMotDePasse.set('');
    this.nvRole.set('client');
    this.erreur.set(null);
    this.creationOuverte.set(true);
  }
  protected fermerCreation(): void {
    this.creationOuverte.set(false);
  }

  protected async creer(): Promise<void> {
    if (
      this.nvNom().trim().length < 2 ||
      !this.nvEmail().trim() ||
      this.nvMotDePasse().length < 8
    ) {
      this.erreur.set('Nom, e-mail et mot de passe (8 car. min) requis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      await this.admin.creerUtilisateur({
        nom_complet: this.nvNom().trim(),
        email: this.nvEmail().trim(),
        telephone: this.nvTelephone().trim() || null,
        mot_de_passe: this.nvMotDePasse(),
        role: this.nvRole(),
      });
      this.creationOuverte.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Création impossible.');
    } finally {
      this.envoi.set(false);
    }
  }
}
