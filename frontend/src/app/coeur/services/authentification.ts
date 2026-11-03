import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environnement } from '../../../environnements/environnement';
import { Jeton } from '../modeles/jeton';
import { Utilisateur } from '../modeles/utilisateur';

const CLE_ACCES = 'ssi_acces';
const CLE_RAFRAICHISSEMENT = 'ssi_refresh';

@Injectable({ providedIn: 'root' })
export class AuthentificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = environnement.urlApi;

  private readonly _jetonAcces = signal<string | null>(localStorage.getItem(CLE_ACCES));
  private readonly _utilisateur = signal<Utilisateur | null>(null);

  readonly utilisateur = this._utilisateur.asReadonly();
  readonly estConnecte = computed(() => this._jetonAcces() !== null);
  readonly estAdmin = computed(() => this._utilisateur()?.role === 'admin');

  constructor() {
    if (this._jetonAcces()) {
      this.chargerMoi().catch(() => this.deconnexion());
    }
  }

  async connexion(email: string, mot_de_passe: string): Promise<void> {
    const jeton = await firstValueFrom(
      this.http.post<Jeton>(`${this.base}/auth/connexion`, { email, mot_de_passe }),
    );
    this._enregistrerJetons(jeton);
    await this.chargerMoi();
  }

  async inscription(donnees: {
    nom_complet: string;
    email: string;
    telephone?: string | null;
    mot_de_passe: string;
  }): Promise<Utilisateur> {
    return firstValueFrom(this.http.post<Utilisateur>(`${this.base}/auth/inscription`, donnees));
  }

  async chargerMoi(): Promise<Utilisateur | null> {
    const utilisateur = await firstValueFrom(this.http.get<Utilisateur>(`${this.base}/auth/moi`));
    this._utilisateur.set(utilisateur);
    return utilisateur;
  }

  /** Charge l'utilisateur si un jeton existe mais que le profil n'est pas encore en mémoire. */
  async assurerUtilisateur(): Promise<Utilisateur | null> {
    if (this._utilisateur()) return this._utilisateur();
    if (!this._jetonAcces()) return null;
    try {
      return await this.chargerMoi();
    } catch {
      this.deconnexion();
      return null;
    }
  }

  deconnexion(): void {
    localStorage.removeItem(CLE_ACCES);
    localStorage.removeItem(CLE_RAFRAICHISSEMENT);
    this._jetonAcces.set(null);
    this._utilisateur.set(null);
    void this.router.navigateByUrl('/');
  }

  private _enregistrerJetons(jeton: Jeton): void {
    localStorage.setItem(CLE_ACCES, jeton.token_acces);
    localStorage.setItem(CLE_RAFRAICHISSEMENT, jeton.token_rafraichissement);
    this._jetonAcces.set(jeton.token_acces);
  }
}
