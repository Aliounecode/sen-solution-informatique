import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AvisAdmin, StatutAvis } from '../../../coeur/modeles/avis';
import { ProduitResume } from '../../../coeur/modeles/produit';
import { AdministrationService } from '../../../coeur/services/administration';

type Filtre = '' | StatutAvis;

@Component({
  selector: 'app-admin-avis',
  imports: [],
  templateUrl: './avis-admin.html',
})
export class AvisAdminPage implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly etoiles = [1, 2, 3, 4, 5];
  protected readonly filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'en_attente', libelle: 'À valider' },
    { valeur: 'publie', libelle: 'Publiés' },
    { valeur: 'refuse', libelle: 'Refusés' },
    { valeur: '', libelle: 'Tous' },
  ];

  protected readonly avis = signal<AvisAdmin[]>([]);
  protected readonly produits = signal<ProduitResume[]>([]);
  protected readonly total = signal(0);
  protected readonly enAttente = signal(0);
  protected readonly page = signal(1);
  protected readonly taille = 20;
  protected readonly filtre = signal<Filtre>('en_attente');
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly nombrePages = computed(() => Math.max(1, Math.ceil(this.total() / this.taille)));

  // Formulaire d'ajout (témoignage reçu hors site : WhatsApp, boutique…)
  protected readonly formulaireOuvert = signal(false);
  protected readonly envoi = signal(false);
  protected readonly nom = signal('');
  protected readonly note = signal(5);
  protected readonly commentaire = signal('');
  protected readonly produitId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    void this._chargerProduits();
    await this.charger();
  }

  private async _chargerProduits(): Promise<void> {
    try {
      this.produits.set((await this.admin.listerProduits({ taille: 60 })).elements);
    } catch {
      /* non bloquant : l'avis pourra rester « sur le site » */
    }
  }

  protected async charger(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const resultat = await this.admin.listerAvis({
        statut: this.filtre(),
        page: this.page(),
        taille: this.taille,
      });
      this.avis.set(resultat.elements);
      this.total.set(resultat.total);
      this.enAttente.set(resultat.en_attente);
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected async choisirFiltre(valeur: Filtre): Promise<void> {
    this.filtre.set(valeur);
    this.page.set(1);
    await this.charger();
  }

  protected async allerPage(cible: number): Promise<void> {
    if (cible < 1 || cible > this.nombrePages()) return;
    this.page.set(cible);
    await this.charger();
  }

  protected async changerStatut(avis: AvisAdmin, statut: StatutAvis): Promise<void> {
    try {
      await this.admin.modifierAvis(avis.id, { statut });
      await this.charger();
    } catch {
      this.erreur.set('Modification impossible.');
    }
  }

  protected async supprimer(avis: AvisAdmin): Promise<void> {
    if (!confirm(`Supprimer l'avis de « ${avis.nom_affiche} » ?`)) return;
    try {
      await this.admin.supprimerAvis(avis.id);
      await this.charger();
    } catch {
      this.erreur.set('Suppression impossible.');
    }
  }

  protected ouvrirFormulaire(): void {
    this.nom.set('');
    this.note.set(5);
    this.commentaire.set('');
    this.produitId.set(null);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected async enregistrer(): Promise<void> {
    if (this.nom().trim().length < 2 || this.commentaire().trim().length < 5) {
      this.erreur.set('Nom (2 caractères min.) et commentaire (5 caractères min.) requis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      await this.admin.creerAvis({
        nom_affiche: this.nom().trim(),
        note: this.note(),
        commentaire: this.commentaire().trim(),
        produit_id: this.produitId(),
        statut: 'publie',
      });
      this.formulaireOuvert.set(false);
      this.filtre.set('publie');
      this.page.set(1);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected libelleStatut(statut: StatutAvis): string {
    return statut === 'publie' ? 'Publié' : statut === 'refuse' ? 'Refusé' : 'À valider';
  }

  protected couleurStatut(statut: StatutAvis): string {
    return statut === 'publie'
      ? 'var(--adm-c5)'
      : statut === 'refuse'
        ? 'var(--color-orange)'
        : 'var(--adm-c3)';
  }

  protected date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR');
  }
}
