import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Avis } from '../../coeur/modeles/avis';
import { AuthentificationService } from '../../coeur/services/authentification';
import { AvisService } from '../../coeur/services/avis';

const MAX_AVIS = 24;
const MIN_DEFILE = 4; // en dessous : affichage statique, sans défilement

@Component({
  selector: 'app-section-avis',
  imports: [RouterLink],
  templateUrl: './section-avis.html',
})
export class SectionAvis {
  /** Produit concerné ; null = avis sur la boutique (page d'accueil). */
  readonly produitId = input<number | null>(null);
  readonly titre = input('Avis de nos clients');

  private readonly service = inject(AvisService);
  protected readonly auth = inject(AuthentificationService);
  protected readonly routeur = inject(Router);

  protected readonly etoiles = [1, 2, 3, 4, 5];
  protected readonly Math = Math;
  protected readonly avis = signal<Avis[]>([]);
  protected readonly total = signal(0);
  protected readonly moyenne = signal<number | null>(null);
  protected readonly chargement = signal(true);
  protected readonly enPause = signal(false); // pause demandée par le bouton

  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly detruire = inject(DestroyRef);
  // Vitesse du défilement (1 = normal, 0 = arrêté), adoucie image par image.
  private vitesse = 1;
  private cible = 1;
  private image = 0;
  private reprise: ReturnType<typeof setTimeout> | null = null;

  /** Défilement automatique seulement s'il y a assez d'avis pour que ce soit joli. */
  protected readonly anime = computed(() => this.avis().length >= MIN_DEFILE);
  protected readonly copies = computed(() => (this.anime() ? [0, 1] : [0]));

  /** On répète les avis jusqu'à remplir la largeur : la boucle ne montre jamais de trou. */
  private readonly base = computed(() => {
    const liste = this.avis();
    if (liste.length < MIN_DEFILE) return liste;
    const rempli = [...liste];
    while (rempli.length < 8) rempli.push(...liste);
    return rempli;
  });

  /** Sur l'accueil, avec assez d'avis : deux rails qui défilent en sens inverse. */
  protected readonly rails = computed(() => {
    const base = this.base();
    return this.produitId() === null && this.avis().length >= 6
      ? [base, [...base].reverse()]
      : [base];
  });

  // Formulaire
  protected readonly formulaireOuvert = signal(false);
  protected readonly note = signal(0);
  protected readonly survol = signal(0);
  protected readonly commentaire = signal('');
  protected readonly nom = linkedSignal(() => this.auth.utilisateur()?.nom_complet ?? '');
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);

  constructor() {
    this.detruire.onDestroy(() => {
      cancelAnimationFrame(this.image);
      if (this.reprise) clearTimeout(this.reprise);
    });
    effect(() => {
      const id = this.produitId();
      void this._charger(id);
    });
  }

  private async _charger(id: number | null): Promise<void> {
    this.chargement.set(true);
    this.confirmation.set(null);
    this.formulaireOuvert.set(false);
    try {
      const page = await this.service.lister(id, MAX_AVIS, 0);
      this.avis.set(page.elements);
      this.total.set(page.total);
      this.moyenne.set(page.moyenne);
    } catch {
      this.avis.set([]);
      this.total.set(0);
      this.moyenne.set(null);
    } finally {
      this.chargement.set(false);
    }
  }

  protected duree(rail: Avis[], indice: number): string {
    // ~9 s par carte pour le rail du haut, un peu plus lent pour celui du bas.
    return `${rail.length * (indice === 0 ? 9 : 11)}s`;
  }

  /** Souris, focus clavier ou doigt sur les avis : le défilement ralentit puis s'arrête. */
  protected pause(): void {
    if (this.reprise) clearTimeout(this.reprise);
    this._viser(0);
  }

  protected reprendre(): void {
    if (this.reprise) clearTimeout(this.reprise);
    if (!this.enPause()) this._viser(1);
  }

  /** Tactile : on reprend 2 s après avoir relâché, le temps de lire. */
  protected reprendreApresToucher(): void {
    if (this.reprise) clearTimeout(this.reprise);
    this.reprise = setTimeout(() => this.reprendre(), 2000);
  }

  protected basculerPause(): void {
    this.enPause.update((v) => !v);
    this._viser(this.enPause() ? 0 : 1);
  }

  private _viser(cible: number): void {
    this.cible = cible;
    if (this.image) return;
    const pas = () => {
      this.vitesse += (this.cible - this.vitesse) * 0.08;
      if (Math.abs(this.cible - this.vitesse) < 0.002) this.vitesse = this.cible;
      this.hote.nativeElement
        .querySelectorAll<HTMLElement>('.avis-piste')
        .forEach((piste) => piste.getAnimations().forEach((a) => (a.playbackRate = this.vitesse)));
      this.image = this.vitesse === this.cible ? 0 : requestAnimationFrame(pas);
    };
    this.image = requestAnimationFrame(pas);
  }

  protected ouvrirFormulaire(): void {
    this.erreur.set(null);
    this.confirmation.set(null);
    this.formulaireOuvert.set(true);
  }

  protected async envoyer(): Promise<void> {
    if (this.note() < 1) {
      this.erreur.set('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    if (this.commentaire().trim().length < 5) {
      this.erreur.set('Écrivez quelques mots sur votre expérience (5 caractères minimum).');
      return;
    }
    if (this.nom().trim().length < 2) {
      this.erreur.set('Indiquez le nom à afficher avec votre avis.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    try {
      const reponse = await this.service.deposer({
        produit_id: this.produitId(),
        note: this.note(),
        commentaire: this.commentaire().trim(),
        nom_affiche: this.nom().trim(),
      });
      this.confirmation.set(reponse.message);
      this.formulaireOuvert.set(false);
      this.note.set(0);
      this.commentaire.set('');
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "Impossible d'envoyer votre avis pour le moment.");
    } finally {
      this.envoi.set(false);
    }
  }

  protected initiales(nom: string): string {
    return (
      nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((m) => m[0]!.toUpperCase())
        .join('') || '?'
    );
  }

  protected date(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}
