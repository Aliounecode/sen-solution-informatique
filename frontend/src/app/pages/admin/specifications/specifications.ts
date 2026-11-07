import { Component, OnInit, inject, signal } from '@angular/core';

import { AdministrationService } from '../../../coeur/services/administration';
import { Specification, TypeValeur } from '../../../coeur/modeles/specification';
import { TypeDeProduit } from '../../../coeur/modeles/type-produit';

@Component({
  selector: 'app-admin-specifications',
  imports: [],
  templateUrl: './specifications.html',
})
export class AdminSpecifications implements OnInit {
  private readonly admin = inject(AdministrationService);

  protected readonly specifications = signal<Specification[]>([]);
  protected readonly types = signal<TypeDeProduit[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  protected readonly formulaireOuvert = signal(false);
  protected readonly editionId = signal<number | null>(null);
  protected readonly envoi = signal(false);

  // Champs
  protected readonly cle = signal('');
  protected readonly libelle = signal('');
  protected readonly groupe = signal('');
  protected readonly typeValeur = signal<TypeValeur>('texte');
  protected readonly unite = signal('');
  protected readonly optionsTexte = signal(''); // options séparées par des virgules
  protected readonly typesChoisis = signal<string[]>([]); // vide = tous les types
  protected readonly ordre = signal(0);
  protected readonly actif = signal(true);

  async ngOnInit(): Promise<void> {
    await this.charger();
  }

  private async charger(): Promise<void> {
    this.chargement.set(true);
    try {
      const [specs, types] = await Promise.all([
        this.admin.listerSpecifications(),
        this.admin.listerTypes(),
      ]);
      this.specifications.set(specs);
      this.types.set(types);
    } catch {
      this.erreur.set('Chargement impossible.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected libelleType(slug: string): string {
    return this.types().find((t) => t.slug === slug)?.libelle ?? slug;
  }

  protected typeCoche(slug: string): boolean {
    return this.typesChoisis().includes(slug);
  }

  protected basculerType(slug: string, coche: boolean): void {
    this.typesChoisis.update((liste) =>
      coche ? [...liste.filter((s) => s !== slug), slug] : liste.filter((s) => s !== slug),
    );
  }

  protected ouvrirCreation(): void {
    this.editionId.set(null);
    this.cle.set('');
    this.libelle.set('');
    this.groupe.set('');
    this.typeValeur.set('texte');
    this.unite.set('');
    this.optionsTexte.set('');
    this.typesChoisis.set([]);
    this.ordre.set(0);
    this.actif.set(true);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected ouvrirEdition(spec: Specification): void {
    this.editionId.set(spec.id);
    this.cle.set(spec.cle);
    this.libelle.set(spec.libelle);
    this.groupe.set(spec.groupe ?? '');
    this.typeValeur.set(spec.type_valeur);
    this.unite.set(spec.unite ?? '');
    this.optionsTexte.set((spec.options ?? []).join(', '));
    this.typesChoisis.set([...(spec.types ?? [])]);
    this.ordre.set(spec.ordre);
    this.actif.set(spec.actif);
    this.erreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected fermer(): void {
    this.formulaireOuvert.set(false);
  }

  private _options(): string[] | null {
    if (this.typeValeur() !== 'liste') return null;
    const options = this.optionsTexte()
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    return options.length > 0 ? options : null;
  }

  protected async enregistrer(): Promise<void> {
    if (this.libelle().trim().length < 1) {
      this.erreur.set('Le libellé est requis.');
      return;
    }
    if (this.editionId() == null && this.cle().trim().length < 1) {
      this.erreur.set('La clé est requise à la création.');
      return;
    }
    this.envoi.set(true);
    this.erreur.set(null);
    // Aucun type coché = la spécification s'applique à tous les types (null).
    const types = this.typesChoisis().length > 0 ? this.typesChoisis() : null;
    try {
      if (this.editionId() != null) {
        // La clé n'est pas modifiable après création (identifiant stable)
        await this.admin.modifierSpecification(this.editionId()!, {
          libelle: this.libelle().trim(),
          groupe: this.groupe().trim() || null,
          type_valeur: this.typeValeur(),
          unite: this.unite().trim() || null,
          options: this._options(),
          types,
          ordre: this.ordre(),
          actif: this.actif(),
        });
      } else {
        await this.admin.creerSpecification({
          cle: this.cle().trim(),
          libelle: this.libelle().trim(),
          groupe: this.groupe().trim() || null,
          type_valeur: this.typeValeur(),
          unite: this.unite().trim() || null,
          options: this._options(),
          types,
          ordre: this.ordre(),
          actif: this.actif(),
        });
      }
      this.formulaireOuvert.set(false);
      await this.charger();
    } catch (erreur: any) {
      this.erreur.set(erreur?.error?.detail ?? 'Enregistrement impossible.');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async supprimer(spec: Specification): Promise<void> {
    if (!confirm(`Supprimer la spécification « ${spec.libelle} » ?`)) return;
    try {
      await this.admin.supprimerSpecification(spec.id);
      await this.charger();
    } catch (erreur: any) {
      alert(erreur?.error?.detail ?? 'Suppression impossible.');
    }
  }
}
