import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

import { DepannageService } from '../../coeur/services/depannage';
import { Demande, StatutDemande } from '../../coeur/modeles/depannage';
import { Fcfa } from '../../coeur/pipes/fcfa';

const ETAPES: { cle: StatutDemande; libelle: string }[] = [
  { cle: 'recue', libelle: 'Reçue' },
  { cle: 'diagnostic', libelle: 'Diagnostic' },
  { cle: 'devis', libelle: 'Devis' },
  { cle: 'en_reparation', libelle: 'En réparation' },
  { cle: 'prete', libelle: 'Prête' },
  { cle: 'livree', libelle: 'Livrée' },
];

@Component({
  selector: 'app-depannage-suivi',
  imports: [DatePipe, Fcfa],
  templateUrl: './depannage-suivi.html',
})
export class DepannageSuivi implements OnInit {
  private readonly service = inject(DepannageService);
  private readonly route = inject(ActivatedRoute);

  protected readonly etapes = ETAPES;
  protected readonly reference = signal('');
  protected readonly demande = signal<Demande | null>(null);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly envoiDevis = signal(false);

  protected readonly estAnnulee = computed(() => this.demande()?.statut === 'annulee');
  protected readonly indexCourant = computed(() => {
    const statut = this.demande()?.statut;
    return statut ? ETAPES.findIndex((e) => e.cle === statut) : -1;
  });

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) {
      this.reference.set(ref);
      this.rechercher();
    }
  }

  protected async rechercher(): Promise<void> {
    const ref = this.reference().trim();
    if (!ref) return;
    this.chargement.set(true);
    this.erreur.set(null);
    this.demande.set(null);
    try {
      this.demande.set(await this.service.suivi(ref));
    } catch {
      this.erreur.set('Aucune demande trouvée pour cette référence.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected etatEtape(i: number): 'fait' | 'courant' | 'avenir' {
    const courant = this.indexCourant();
    if (i < courant) return 'fait';
    if (i === courant) return 'courant';
    return 'avenir';
  }

  protected async repondre(accepte: boolean): Promise<void> {
    const ref = this.demande()?.reference;
    if (!ref) return;
    this.envoiDevis.set(true);
    this.erreur.set(null);
    try {
      this.demande.set(await this.service.repondreDevis(ref, accepte));
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "Votre réponse n'a pas pu être enregistrée.");
    } finally {
      this.envoiDevis.set(false);
    }
  }
}
