import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AdministrationService } from '../../../coeur/services/administration';
import { Categorie } from '../../../coeur/modeles/categorie';
import { Specification } from '../../../coeur/modeles/specification';
import { ImageProduit, TypeProduit } from '../../../coeur/modeles/produit';
import { TypeDeProduit } from '../../../coeur/modeles/type-produit';

@Component({
  selector: 'app-produit-edition',
  imports: [RouterLink],
  templateUrl: './produit-edition.html',
})
export class ProduitEdition implements OnInit {
  private readonly admin = inject(AdministrationService);
  private readonly routeur = inject(Router);

  readonly id = input<string>('');

  protected readonly enEdition = signal(false);
  protected readonly produitId = signal<number | null>(null);
  protected readonly categories = signal<Categorie[]>([]);
  protected readonly specifications = signal<Specification[]>([]);
  protected readonly types = signal<TypeDeProduit[]>([]);
  /** Type du produit au chargement (null à la création) : sert à conserver les valeurs de specs masquées. */
  private readonly typeInitial = signal<TypeProduit | null>(null);
  protected readonly images = signal<ImageProduit[]>([]);
  protected readonly imagesEnAttente = signal<{ url: string; public_id: string | null }[]>([]);

  protected readonly chargement = signal(true);
  protected readonly envoi = signal(false);
  protected readonly televersement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly reference = signal('');
  protected readonly nom = signal('');
  protected readonly categorieId = signal<number | null>(null);
  protected readonly typeProduit = signal<TypeProduit>('');
  protected readonly marque = signal('');
  protected readonly modele = signal('');
  protected readonly description = signal('');
  protected readonly prix = signal<number | null>(null);
  protected readonly prixPromo = signal<number | null>(null);
  protected readonly promoActive = signal(false);
  protected readonly stock = signal<number>(0);
  protected readonly enVedette = signal(false);
  protected readonly actif = signal(true);
  protected readonly caracteristiques = signal<Record<string, string>>({});
  protected readonly caracteristiquesLibres = signal<{ nom: string; valeur: string }[]>([]);

  /** Types proposés : les types actifs (+ le type courant du produit s'il a été désactivé depuis). */
  protected readonly typesProposes = computed(() =>
    this.types().filter((t) => t.actif || t.slug === this.typeProduit()),
  );

  protected readonly libelleTypeCourant = computed(
    () => this.types().find((t) => t.slug === this.typeProduit())?.libelle ?? '',
  );

  /** Spécifications applicables au type choisi (types vide/null = tous les types). */
  protected readonly specsVisibles = computed(() =>
    this.specifications().filter((s) => this._concerne(s, this.typeProduit())),
  );

  protected readonly urlImage = signal('');
  protected readonly publicIdImage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const [categories, specifications, types] = await Promise.all([
        this.admin.listerCategories(),
        this.admin.listerSpecifications(),
        this.admin.listerTypes(),
      ]);
      this.categories.set(categories);
      this.types.set(types);
      this.specifications.set(specifications.filter((s) => s.actif));

      const parametre = this.id();
      if (parametre && parametre !== 'nouveau') {
        this.enEdition.set(true);
        const produit = await this.admin.obtenirProduit(Number(parametre));
        this.produitId.set(produit.id);
        this.reference.set(produit.reference);
        this.nom.set(produit.nom);
        this.categorieId.set(produit.categorie_id);
        this.typeProduit.set(produit.type_produit);
        this.typeInitial.set(produit.type_produit);
        this.marque.set(produit.marque ?? '');
        this.modele.set(produit.modele ?? '');
        this.description.set(produit.description ?? '');
        this.prix.set(produit.prix);
        this.prixPromo.set(produit.prix_promo);
        this.promoActive.set(produit.promo_active);
        this.stock.set(produit.quantite_stock);
        this.enVedette.set(produit.en_vedette);
        this.actif.set(produit.actif);
        this.images.set(produit.images);

        // Séparer les specs prédéfinies des champs personnalisés
        const clesSpecs = new Set(this.specifications().map((s) => s.cle));
        const valeursSpecs: Record<string, string> = {};
        const libres: { nom: string; valeur: string }[] = [];
        for (const [cle, valeur] of Object.entries(produit.caracteristiques ?? {})) {
          if (clesSpecs.has(cle)) {
            valeursSpecs[cle] = String(valeur ?? '');
          } else {
            libres.push({ nom: cle, valeur: String(valeur ?? '') });
          }
        }
        this.caracteristiques.set(valeursSpecs);
        this.caracteristiquesLibres.set(libres);
      } else {
        if (categories.length > 0) this.categorieId.set(categories[0].id);
        const premier = types.find((t) => t.actif);
        if (premier) this.typeProduit.set(premier.slug);
      }
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  private _concerne(spec: Specification, type: TypeProduit): boolean {
    return !spec.types || spec.types.length === 0 || spec.types.includes(type);
  }

  protected majCaracteristique(cle: string, valeur: string): void {
    this.caracteristiques.update((c) => ({ ...c, [cle]: valeur }));
  }

  // --- Champs personnalisés ---
  protected ajouterLigneLibre(): void {
    this.caracteristiquesLibres.update((l) => [...l, { nom: '', valeur: '' }]);
  }
  protected majLibreNom(index: number, nom: string): void {
    this.caracteristiquesLibres.update((l) => l.map((x, i) => (i === index ? { ...x, nom } : x)));
  }
  protected majLibreValeur(index: number, valeur: string): void {
    this.caracteristiquesLibres.update((l) =>
      l.map((x, i) => (i === index ? { ...x, valeur } : x)),
    );
  }
  protected retirerLibre(index: number): void {
    this.caracteristiquesLibres.update((l) => l.filter((_, i) => i !== index));
  }

  private _construireCaracteristiques(): Record<string, unknown> {
    const source = this.caracteristiques();
    const resultat: Record<string, unknown> = {};
    // On ne garde que les specs du type choisi ; si le type n'a pas changé, on conserve aussi
    // les valeurs déjà enregistrées pour des specs masquées (aucune perte silencieuse).
    const typeInchange = this.typeProduit() === this.typeInitial();
    for (const spec of this.specifications()) {
      if (!typeInchange && !this._concerne(spec, this.typeProduit())) continue;
      const brut = (source[spec.cle] ?? '').trim();
      if (brut === '') continue;
      if (spec.type_valeur === 'nombre') {
        const nombre = Number(brut);
        resultat[spec.cle] = Number.isNaN(nombre) ? brut : nombre;
      } else if (spec.type_valeur === 'booleen') {
        resultat[spec.cle] = brut === 'true' || brut === 'oui';
      } else {
        resultat[spec.cle] = brut;
      }
    }
    for (const ligne of this.caracteristiquesLibres()) {
      const nom = ligne.nom.trim();
      const valeur = ligne.valeur.trim();
      if (nom && valeur) resultat[nom] = valeur;
    }
    return resultat;
  }

  private async _ajouterImageDepuis(url: string, public_id: string | null): Promise<void> {
    if (this.enEdition() && this.produitId() != null) {
      const produit = await this.admin.ajouterImage(this.produitId()!, {
        url,
        public_id: public_id ?? undefined,
        est_principale: this.images().length === 0,
      });
      this.images.set(produit.images);
    } else {
      this.imagesEnAttente.update((liste) => [...liste, { url, public_id }]);
    }
  }

  /** Avancement du téléversement multiple (null = aucun en cours). */
  protected readonly progression = signal<{ fait: number; total: number } | null>(null);

  /** Téléverse plusieurs images d'un coup (3 en parallèle), puis les ajoute au produit dans l'ordre choisi. */
  protected async surFichier(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const choisis = Array.from(input.files ?? []);
    if (choisis.length === 0) return;

    const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo (limite Cloudinary gratuit)
    const fichiers = choisis.filter((f) => f.type.startsWith('image/') && f.size <= TAILLE_MAX);
    const ignores = choisis.filter((f) => !fichiers.includes(f)).map((f) => f.name);
    if (fichiers.length === 0) {
      this.erreur.set(`Aucune image valide (images de 10 Mo maximum) : ${ignores.join(', ')}`);
      input.value = '';
      return;
    }

    this.televersement.set(true);
    this.erreur.set(null);
    this.progression.set({ fait: 0, total: fichiers.length });

    const echecs: string[] = [...ignores];
    const resultats: ({ url: string; public_id: string } | null)[] = new Array(
      fichiers.length,
    ).fill(null);
    let suivant = 0;

    const travailleur = async (): Promise<void> => {
      while (suivant < fichiers.length) {
        const i = suivant++;
        try {
          resultats[i] = await this.admin.televerserImageCloudinary(fichiers[i]);
        } catch {
          echecs.push(fichiers[i].name);
        }
        this.progression.update((p) => (p ? { ...p, fait: p.fait + 1 } : p));
      }
    };

    try {
      await Promise.all(Array.from({ length: Math.min(3, fichiers.length) }, travailleur));
      // Ajout au produit dans l'ordre de sélection : la première image devient la principale si besoin.
      for (const resultat of resultats) {
        if (!resultat) continue;
        try {
          await this._ajouterImageDepuis(resultat.url, resultat.public_id);
        } catch {
          echecs.push("(enregistrement d'une image)");
        }
      }
    } finally {
      this.televersement.set(false);
      this.progression.set(null);
      input.value = '';
    }

    if (echecs.length > 0) {
      this.erreur.set(`Certaines images n'ont pas pu être ajoutées : ${echecs.join(', ')}`);
    }
  }

  /** Édition : l'image choisie devient la principale (enregistré tout de suite). */
  protected async definirPrincipale(imageId: number): Promise<void> {
    this.erreur.set(null);
    try {
      const produit = await this.admin.definirImagePrincipale(imageId);
      this.images.set(produit.images);
    } catch {
      this.erreur.set("Impossible de changer l'image principale.");
    }
  }

  /** Création : l'image choisie passe en première position, donc principale à l'enregistrement. */
  protected definirPrincipaleEnAttente(index: number): void {
    this.imagesEnAttente.update((liste) => {
      const copie = [...liste];
      const [choisie] = copie.splice(index, 1);
      return [choisie, ...copie];
    });
  }

  protected async ajouterImageUrl(): Promise<void> {
    if (!this.urlImage().trim()) return;
    try {
      await this._ajouterImageDepuis(this.urlImage().trim(), this.publicIdImage().trim() || null);
      this.urlImage.set('');
      this.publicIdImage.set('');
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? "Ajout de l'image impossible.");
    }
  }

  protected retirerEnAttente(index: number): void {
    this.imagesEnAttente.update((liste) => liste.filter((_, i) => i !== index));
  }

  protected async supprimerImage(imageId: number): Promise<void> {
    try {
      await this.admin.supprimerImage(imageId);
      this.images.update((liste) => liste.filter((i) => i.id !== imageId));
    } catch {
      this.erreur.set("Suppression de l'image impossible.");
    }
  }

  protected async enregistrer(): Promise<void> {
    if (this.nom().trim().length < 2 || this.categorieId() == null) {
      this.erreur.set('Nom et catégorie sont requis.');
      return;
    }
    if (!this.typeProduit()) {
      this.erreur.set('Choisissez un type de produit.');
      return;
    }
    if (this.prix() == null || this.prix()! < 0) {
      this.erreur.set('Le prix est requis.');
      return;
    }

    this.envoi.set(true);
    this.erreur.set(null);
    const donnees: Record<string, unknown> = {
      reference: this.reference().trim() || null,
      nom: this.nom().trim(),
      categorie_id: this.categorieId(),
      type_produit: this.typeProduit(),
      marque: this.marque().trim() || null,
      modele: this.modele().trim() || null,
      description: this.description().trim() || null,
      prix: this.prix(),
      prix_promo: this.prixPromo(),
      promo_active: this.promoActive(),
      quantite_stock: this.stock(),
      caracteristiques: this._construireCaracteristiques(),
      en_vedette: this.enVedette(),
      actif: this.actif(),
    };

    try {
      if (this.enEdition() && this.produitId() != null) {
        await this.admin.modifierProduit(this.produitId()!, donnees);
      } else {
        const cree = await this.admin.creerProduit(donnees);
        const enAttente = this.imagesEnAttente();
        for (let i = 0; i < enAttente.length; i++) {
          await this.admin.ajouterImage(cree.id, {
            url: enAttente[i].url,
            public_id: enAttente[i].public_id ?? undefined,
            est_principale: i === 0,
          });
        }
      }
      this.routeur.navigateByUrl('/admin/produits');
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }
}
