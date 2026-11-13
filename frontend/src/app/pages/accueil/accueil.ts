import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CarteProduit } from '../../composants/carte-produit/carte-produit';
import { SectionAvis } from '../../composants/section-avis/section-avis';
import { Categorie } from '../../coeur/modeles/categorie';
import { ProduitResume } from '../../coeur/modeles/produit';
import { CatalogueService } from '../../coeur/services/catalogue';
import { environnement } from '../../../environnements/environnement';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, CarteProduit, SectionAvis],
  templateUrl: './accueil.html',
})
export class Accueil implements OnInit {
  private readonly catalogue = inject(CatalogueService);

  protected readonly urlVideo = environnement.urlVideoAccueil;
  protected readonly urlPoster = environnement.urlAffichePoster;

  protected readonly chargement = signal(true);
  protected readonly categories = signal<Categorie[]>([]);
  protected readonly promos = signal<ProduitResume[]>([]);
  protected readonly vedettes = signal<ProduitResume[]>([]);
  protected readonly recents = signal<ProduitResume[]>([]);
  protected readonly echantillon = signal<ProduitResume[]>([]);

  protected readonly racines = computed(() =>
    this.categories()
      .filter((c) => c.actif && c.parent_id == null)
      .sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom))
      .slice(0, 6),
  );

  protected imageCategorie(nom: string): string {
    const categorie = nom.toLowerCase().trim();

    if (categorie.includes('ordinateur')) {
      return '/images/categories/ordinateurs.webp';
    }

    if (categorie.includes('accessoire')) {
      return '/images/categories/accessoires.webp';
    }

    if (categorie.includes('console')) {
      return '/images/categories/consoles.webp';
    }

    return '/images/categories/ordinateurs.webp';
  }

  protected readonly marques = computed(() => {
    const compte = new Map<string, number>();
    for (const p of this.echantillon()) {
      const marque = p.marque?.trim();
      if (marque) compte.set(marque, (compte.get(marque) ?? 0) + 1);
    }
    return Array.from(compte, ([nom, nombre]) => ({ nom, nombre }))
      .sort((a, b) => b.nombre - a.nombre)
      .slice(0, 8);
  });

  protected readonly etapes = [
    { titre: 'Décrivez la panne', texte: 'Un formulaire simple, sans compte obligatoire.' },
    { titre: 'Diagnostic', texte: 'Un technicien examine votre appareil.' },
    { titre: 'Devis clair', texte: 'Vous acceptez ou refusez avant toute réparation.' },
    { titre: 'Réparation', texte: 'Suivez chaque étape avec votre référence.' },
    { titre: 'Récupération', texte: "Vous êtes prévenu dès que c'est prêt." },
  ];

  protected readonly garanties = [
    { titre: 'Retrait ou livraison', texte: 'Choisissez au moment de commander.' },
    { titre: 'Suivi par référence', texte: 'Commandes et dépannages, sans compte.' },
    { titre: 'Devis avant réparation', texte: 'Aucune surprise sur le prix.' },
    { titre: 'Paiement local', texte: 'Espèces, Orange Money, Wave.' },
  ];

  async ngOnInit(): Promise<void> {
    const [cats, promos, vedettes, recents, tous] = await Promise.allSettled([
      this.catalogue.listerCategories(),
      this.catalogue.listerProduits({ en_promo: true, taille: 4 }),
      this.catalogue.listerProduits({ en_vedette: true, taille: 4 }),
      this.catalogue.listerProduits({ tri: 'recent', taille: 8 }),
      this.catalogue.listerProduits({ taille: 60 }),
    ]);
    if (cats.status === 'fulfilled') this.categories.set(cats.value);
    if (promos.status === 'fulfilled') this.promos.set(promos.value.elements);
    if (vedettes.status === 'fulfilled') this.vedettes.set(vedettes.value.elements);
    if (recents.status === 'fulfilled') this.recents.set(recents.value.elements);
    if (tous.status === 'fulfilled') this.echantillon.set(tous.value.elements);
    this.chargement.set(false);
  }
}
