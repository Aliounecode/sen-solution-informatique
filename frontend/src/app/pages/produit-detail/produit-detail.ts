import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environnement } from '../../../environnements/environnement';
import { CarteProduit } from '../../composants/carte-produit/carte-produit';
import { SectionAvis } from '../../composants/section-avis/section-avis';
import { ProduitComplet, ProduitResume } from '../../coeur/modeles/produit';
import { Specification } from '../../coeur/modeles/specification';
import { Fcfa } from '../../coeur/pipes/fcfa';
import { CatalogueService } from '../../coeur/services/catalogue';
import { NotificationService } from '../../coeur/services/notifications';
import { PanierService } from '../../coeur/services/panier';

@Component({
  selector: 'app-produit-detail',
  imports: [RouterLink, Fcfa, CarteProduit, SectionAvis],
  templateUrl: './produit-detail.html',
  host: {
    '(document:keydown.arrowleft)': 'precedente()',
    '(document:keydown.arrowright)': 'suivante()',
  },
})
export class ProduitDetail {
  readonly slug = input.required<string>();

  private readonly catalogue = inject(CatalogueService);
  private readonly panier = inject(PanierService);
  private readonly notifications = inject(NotificationService);

  protected readonly produit = signal<ProduitComplet | null>(null);
  protected readonly specifications = signal<Specification[]>([]);
  protected readonly similaires = signal<ProduitResume[]>([]);
  protected readonly chargementSimilaires = signal(false);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly indexImage = signal(0);
  protected readonly quantite = signal(1);
  protected readonly confirme = signal(false);

  protected readonly enPromo = computed(() => {
    const p = this.produit();
    return !!p && p.promo_active && p.prix_promo != null;
  });
  protected readonly enRupture = computed(() => (this.produit()?.quantite_stock ?? 0) <= 0);

  protected readonly onglet = signal<'description' | 'caracteristiques'>('description');

  protected readonly reduction = computed(() => {
    const p = this.produit();
    if (!p || !this.enPromo() || p.prix <= 0) return 0;
    return Math.round((1 - (p.prix_promo as number) / p.prix) * 100);
  });

  protected readonly lienWhatsapp = computed(() => {
    const p = this.produit();
    if (!p || !environnement.whatsapp) return null;
    const texte = `Bonjour, je suis intéressé par « ${p.nom} » (réf. ${p.reference}).`;
    return `https://wa.me/${environnement.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texte)}`;
  });

  protected readonly imageActive = computed(() => {
    const p = this.produit();
    if (!p || p.images.length === 0) return null;
    return (p.images[this.indexImage()] ?? p.images[0]).url;
  });

  protected readonly caracteristiquesGroupees = computed(() => {
    const produit = this.produit();
    if (!produit) return [];
    const parCle = new Map(this.specifications().map((d) => [d.cle, d]));
    const groupes = new Map<string, { libelle: string; valeur: string }[]>();
    for (const [cle, brute] of Object.entries(produit.caracteristiques ?? {})) {
      const def = parCle.get(cle);
      const libelle = def?.libelle ?? cle;
      const groupe = def?.groupe ?? 'Autres';
      let valeur = typeof brute === 'boolean' ? (brute ? 'Oui' : 'Non') : String(brute);
      if (def?.unite) valeur = `${valeur} ${def.unite}`;
      if (!groupes.has(groupe)) groupes.set(groupe, []);
      groupes.get(groupe)!.push({ libelle, valeur });
    }
    return Array.from(groupes, ([groupe, items]) => ({ groupe, items }));
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      this._charger(slug);
    });
  }

  private async _charger(slug: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    this.quantite.set(1);
    this.onglet.set('description');
    this.similaires.set([]);
    window.scrollTo({ top: 0 });
    try {
      const [produit, specifications] = await Promise.all([
        this.catalogue.obtenirProduit(slug),
        this.catalogue.listerSpecifications(),
      ]);
      this.produit.set(produit);
      this.specifications.set(specifications);
      const principale = Math.max(
        0,
        produit.images.findIndex((i) => i.est_principale),
      );
      this.indexImage.set(principale);
      void this._chargerSimilaires(slug);
    } catch {
      this.erreur.set("Ce produit est introuvable ou n'est plus disponible.");
    } finally {
      this.chargement.set(false);
    }
  }

  private async _chargerSimilaires(slug: string): Promise<void> {
    this.chargementSimilaires.set(true);
    try {
      const liste = await this.catalogue.produitsSimilaires(slug, 4);
      if (slug === this.slug()) this.similaires.set(liste);
    } catch {
      this.similaires.set([]);
    } finally {
      this.chargementSimilaires.set(false);
    }
  }

  protected precedente(): void {
    const n = this.produit()?.images.length ?? 0;
    if (n < 2) return;
    this.indexImage.update((i) => (i - 1 + n) % n);
  }

  protected suivante(): void {
    const n = this.produit()?.images.length ?? 0;
    if (n < 2) return;
    this.indexImage.update((i) => (i + 1) % n);
  }

  protected changerQuantite(delta: number): void {
    const max = this.produit()?.quantite_stock ?? 1;
    this.quantite.update((q) => Math.min(Math.max(1, q + delta), Math.max(1, max)));
  }

  protected ajouterAuPanier(): void {
    const produit = this.produit();
    if (!produit || this.enRupture()) return;
    const image = produit.images.find((i) => i.est_principale) ?? produit.images[0];
    const prix =
      produit.promo_active && produit.prix_promo != null ? produit.prix_promo : produit.prix;
    this.panier.ajouter(
      {
        produit_id: produit.id,
        nom: produit.nom,
        slug: produit.slug,
        prix,
        image: image?.url ?? null,
      },
      this.quantite(),
    );
    this.confirme.set(true);
    this.notifications.succes(`${produit.nom} ajouté au panier`);
    setTimeout(() => this.confirme.set(false), 2500);
  }
}
