import { Component, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CarteProduit } from '../../composants/carte-produit/carte-produit';
import { Categorie } from '../../coeur/modeles/categorie';
import { ProduitResume, TypeProduit } from '../../coeur/modeles/produit';
import { CatalogueService, FiltresProduits } from '../../coeur/services/catalogue';

const TRIS = ['recent', 'prix_asc', 'prix_desc', 'nom'];
const parOrdre = (a: Categorie, b: Categorie) => a.ordre - b.ordre || a.nom.localeCompare(b.nom);

@Component({
  selector: 'app-boutique',
  imports: [CarteProduit, RouterLink],
  templateUrl: './boutique.html',
})
export class Boutique {
  private readonly catalogue = inject(CatalogueService);
  private readonly route = inject(ActivatedRoute);
  private readonly routeur = inject(Router);

  protected readonly categories = signal<Categorie[]>([]);
  protected readonly produits = signal<ProduitResume[]>([]);
  protected readonly total = signal(0);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly filtresOuverts = signal(false);
  protected readonly taille = 12;
  private dernierId = 0;

  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly recherche = computed(() => this.params().get('q') ?? '');
  protected readonly categorieId = computed(() => {
    const v = Number(this.params().get('categorie'));
    return Number.isInteger(v) && v > 0 ? v : null;
  });
  protected readonly typeProduit = computed<TypeProduit | null>(() => {
    const v = this.params().get('type');
    return v === 'ordinateur' || v === 'accessoire' ? v : null;
  });
  protected readonly tri = computed(() => {
    const v = this.params().get('tri') ?? '';
    return TRIS.includes(v) ? v : 'recent';
  });
  protected readonly page = computed(() => Math.max(1, Number(this.params().get('page')) || 1));
  protected readonly prixMin = computed(() => this._entier('prix_min'));
  protected readonly prixMax = computed(() => this._entier('prix_max'));
  protected readonly promo = computed(() => this.params().get('promo') === '1');

  // Champs de saisie : se resynchronisent quand l'URL change (ex. recherche depuis l'en-tête).
  protected readonly saisieRecherche = linkedSignal(() => this.recherche());
  protected readonly saisiePrixMin = linkedSignal(() => this.prixMin()?.toString() ?? '');
  protected readonly saisiePrixMax = linkedSignal(() => this.prixMax()?.toString() ?? '');

  protected readonly nombrePages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.taille)),
  );

  protected readonly arbre = computed(() => {
    const actives = this.categories().filter((c) => c.actif);
    return actives
      .filter((c) => c.parent_id == null)
      .sort(parOrdre)
      .map((racine) => ({
        ...racine,
        enfants: actives.filter((c) => c.parent_id === racine.id).sort(parOrdre),
      }));
  });

  protected readonly chips = computed(() => {
    const liste: { libelle: string; cles: string[] }[] = [];
    if (this.recherche()) liste.push({ libelle: `« ${this.recherche()} »`, cles: ['q'] });
    const cat = this.categories().find((c) => c.id === this.categorieId());
    if (this.categorieId()) liste.push({ libelle: cat?.nom ?? 'Catégorie', cles: ['categorie'] });
    if (this.typeProduit()) {
      liste.push({
        libelle: this.typeProduit() === 'ordinateur' ? 'Ordinateurs' : 'Accessoires',
        cles: ['type'],
      });
    }
    if (this.promo()) liste.push({ libelle: 'Promotions', cles: ['promo'] });
    if (this.prixMin() != null || this.prixMax() != null) {
      liste.push({
        libelle: `Prix : ${this.prixMin() ?? 0} – ${this.prixMax() ?? '∞'} FCFA`,
        cles: ['prix_min', 'prix_max'],
      });
    }
    return liste;
  });

  private readonly filtres = computed<FiltresProduits>(() => ({
    recherche: this.recherche() || undefined,
    categorie_id: this.categorieId() ?? undefined,
    type_produit: this.typeProduit() ?? undefined,
    en_promo: this.promo() || undefined,
    prix_min: this.prixMin() ?? undefined,
    prix_max: this.prixMax() ?? undefined,
    tri: this.tri(),
    page: this.page(),
    taille: this.taille,
  }));

  constructor() {
    void this._chargerCategories();
    effect(() => {
      void this._charger(this.filtres());
    });
  }

  protected estOuverte(racine: { id: number; enfants: Categorie[] }): boolean {
    const id = this.categorieId();
    return id === racine.id || racine.enfants.some((e) => e.id === id);
  }

  protected soumettreRecherche(): void {
    this.naviguer({ q: this.saisieRecherche().trim() || null });
  }

  protected appliquerPrix(): void {
    this.naviguer({
      prix_min: this._versEntier(this.saisiePrixMin()),
      prix_max: this._versEntier(this.saisiePrixMax()),
    });
  }

  protected choisirCategorie(id: number | null): void {
    this.naviguer({ categorie: id });
    this.filtresOuverts.set(false);
  }

  protected choisirType(valeur: string): void {
    this.naviguer({ type: valeur || null });
  }

  protected choisirTri(valeur: string): void {
    this.naviguer({ tri: valeur === 'recent' ? null : valeur });
  }

  protected basculerPromo(): void {
    this.naviguer({ promo: this.promo() ? null : 1 });
  }

  protected retirer(cles: string[]): void {
    this.naviguer(Object.fromEntries(cles.map((c) => [c, null])));
  }

  protected reinitialiser(): void {
    void this.routeur.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected allerPage(cible: number): void {
    if (cible < 1 || cible > this.nombrePages()) return;
    this.naviguer({ page: cible > 1 ? cible : null }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private naviguer(changements: Record<string, string | number | null>, reinitPage = true): void {
    void this.routeur.navigate([], {
      relativeTo: this.route,
      queryParams: reinitPage ? { ...changements, page: null } : changements,
      queryParamsHandling: 'merge',
    });
  }

  private async _chargerCategories(): Promise<void> {
    try {
      this.categories.set(await this.catalogue.listerCategories());
    } catch {
      /* non bloquant */
    }
  }

  private async _charger(filtres: FiltresProduits): Promise<void> {
    const id = ++this.dernierId;
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const resultat = await this.catalogue.listerProduits(filtres);
      if (id !== this.dernierId) return;
      this.produits.set(resultat.elements);
      this.total.set(resultat.total);
    } catch {
      if (id === this.dernierId)
        this.erreur.set('Impossible de charger les produits pour le moment.');
    } finally {
      if (id === this.dernierId) this.chargement.set(false);
    }
  }

  private _entier(cle: string): number | null {
    const brut = this.params().get(cle);
    if (brut === null || brut === '') return null;
    const n = Number(brut);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }

  private _versEntier(valeur: string): number | null {
    return valeur.trim() === '' ? null : (this._entier2(valeur) ?? null);
  }

  private _entier2(valeur: string): number | null {
    const n = Number(valeur);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }
}
