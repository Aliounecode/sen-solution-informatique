import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environnement } from '../../../environnements/environnement';
import { StatistiquesResume } from '../modeles/statistiques';
import { Categorie } from '../modeles/categorie';
import { Commande } from '../modeles/commande';
import { PageProduits, ProduitComplet } from '../modeles/produit';
import { Specification } from '../modeles/specification';
import { TypeDeProduit } from '../modeles/type-produit';

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  private readonly http = inject(HttpClient);
  private readonly base = environnement.urlApi;

  // ---- Statistiques ----
  statistiques(): Promise<StatistiquesResume> {
    return firstValueFrom(this.http.get<StatistiquesResume>(`${this.base}/admin/statistiques`));
  }

  // ---- Types de produits (ordinateur, accessoire, console…) ----
  listerTypes(): Promise<TypeDeProduit[]> {
    return firstValueFrom(this.http.get<TypeDeProduit[]>(`${this.base}/admin/types`));
  }

  creerType(donnees: { libelle: string; ordre?: number; actif?: boolean }): Promise<TypeDeProduit> {
    return firstValueFrom(this.http.post<TypeDeProduit>(`${this.base}/admin/types`, donnees));
  }

  modifierType(
    id: number,
    donnees: { libelle?: string; ordre?: number; actif?: boolean },
  ): Promise<TypeDeProduit> {
    return firstValueFrom(this.http.put<TypeDeProduit>(`${this.base}/admin/types/${id}`, donnees));
  }

  supprimerType(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/types/${id}`));
  }

  // ---- Catégories ----
  listerCategories(): Promise<Categorie[]> {
    return firstValueFrom(this.http.get<Categorie[]>(`${this.base}/admin/categories`));
  }

  creerCategorie(donnees: Record<string, unknown>): Promise<Categorie> {
    return firstValueFrom(this.http.post<Categorie>(`${this.base}/admin/categories`, donnees));
  }

  modifierCategorie(id: number, donnees: Record<string, unknown>): Promise<Categorie> {
    return firstValueFrom(this.http.put<Categorie>(`${this.base}/admin/categories/${id}`, donnees));
  }

  supprimerCategorie(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/categories/${id}`));
  }

  // ---- Spécifications (définitions) ----
  listerSpecifications(): Promise<Specification[]> {
    return firstValueFrom(this.http.get<Specification[]>(`${this.base}/admin/specifications`));
  }

  creerSpecification(donnees: Record<string, unknown>): Promise<Specification> {
    return firstValueFrom(
      this.http.post<Specification>(`${this.base}/admin/specifications`, donnees),
    );
  }

  modifierSpecification(id: number, donnees: Record<string, unknown>): Promise<Specification> {
    return firstValueFrom(
      this.http.put<Specification>(`${this.base}/admin/specifications/${id}`, donnees),
    );
  }

  supprimerSpecification(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/specifications/${id}`));
  }

  // ---- Produits ----
  listerProduits(
    filtres: {
      categorie_id?: number;
      type_produit?: string;
      recherche?: string;
      page?: number;
      taille?: number;
    } = {},
  ): Promise<PageProduits> {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        params = params.set(cle, String(valeur));
      }
    }
    return firstValueFrom(this.http.get<PageProduits>(`${this.base}/admin/produits`, { params }));
  }

  obtenirProduit(id: number): Promise<ProduitComplet> {
    return firstValueFrom(this.http.get<ProduitComplet>(`${this.base}/admin/produits/${id}`));
  }

  creerProduit(donnees: Record<string, unknown>): Promise<ProduitComplet> {
    return firstValueFrom(this.http.post<ProduitComplet>(`${this.base}/admin/produits`, donnees));
  }

  modifierProduit(id: number, donnees: Record<string, unknown>): Promise<ProduitComplet> {
    return firstValueFrom(
      this.http.put<ProduitComplet>(`${this.base}/admin/produits/${id}`, donnees),
    );
  }

  supprimerProduit(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/produits/${id}`));
  }

  ajouterImage(
    produitId: number,
    image: { url: string; public_id?: string; ordre?: number; est_principale?: boolean },
  ): Promise<ProduitComplet> {
    return firstValueFrom(
      this.http.post<ProduitComplet>(`${this.base}/admin/produits/${produitId}/images`, image),
    );
  }

  supprimerImage(imageId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/produits/images/${imageId}`));
  }

  definirImagePrincipale(imageId: number): Promise<ProduitComplet> {
    return firstValueFrom(
      this.http.put<ProduitComplet>(`${this.base}/admin/produits/images/${imageId}/principale`, {}),
    );
  }

  signatureCloudinary(): Promise<{
    timestamp: number;
    signature: string;
    api_key: string;
    cloud_name: string;
    dossier: string;
  }> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/admin/produits/signature-cloudinary`, {}),
    );
  }

  async televerserImageCloudinary(fichier: File): Promise<{ url: string; public_id: string }> {
    const sig = await this.signatureCloudinary();
    const form = new FormData();
    form.append('file', fichier);
    form.append('api_key', sig.api_key);
    form.append('timestamp', String(sig.timestamp));
    form.append('signature', sig.signature);
    form.append('folder', sig.dossier);
    // Appel direct à Cloudinary (hors intercepteur : on n'envoie pas notre JWT)
    const reponse = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!reponse.ok) throw new Error('Téléversement Cloudinary échoué');
    const data = await reponse.json();
    return { url: data.secure_url, public_id: data.public_id };
  }

  // ---- Commandes ----
  listerCommandes(
    filtres: { statut?: string; recherche?: string; page?: number; taille?: number } = {},
  ): Promise<{
    total: number;
    page: number;
    taille: number;
    elements: Commande[];
  }> {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '')
        params = params.set(cle, String(valeur));
    }
    return firstValueFrom(
      this.http.get<{ total: number; page: number; taille: number; elements: Commande[] }>(
        `${this.base}/admin/commandes`,
        { params },
      ),
    );
  }

  obtenirCommande(
    id: number,
  ): Promise<
    Commande & {
      id: number;
      nom_client: string;
      telephone_client: string;
      email_client: string | null;
      note_interne: string | null;
      client_id: number | null;
    }
  > {
    return firstValueFrom(this.http.get<any>(`${this.base}/admin/commandes/${id}`));
  }

  changerStatutCommande(id: number, statut: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/admin/commandes/${id}/statut`, { statut }),
    );
  }

  modifierCommande(
    id: number,
    donnees: { moyen_paiement?: string | null; note_interne?: string | null },
  ): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.base}/admin/commandes/${id}`, donnees));
  }

  // ---- Demandes de dépannage ----
  listerDemandes(
    filtres: {
      statut?: string;
      technicien_id?: number;
      recherche?: string;
      page?: number;
      taille?: number;
    } = {},
  ): Promise<{
    total: number;
    page: number;
    taille: number;
    elements: any[];
  }> {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '')
        params = params.set(cle, String(valeur));
    }
    return firstValueFrom(
      this.http.get<{ total: number; page: number; taille: number; elements: any[] }>(
        `${this.base}/admin/demandes`,
        { params },
      ),
    );
  }

  obtenirDemande(id: number): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.base}/admin/demandes/${id}`));
  }

  changerStatutDemande(id: number, statut: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/admin/demandes/${id}/statut`, { statut }),
    );
  }

  modifierDemande(id: number, donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.base}/admin/demandes/${id}`, donnees));
  }

  // ---- Techniciens ----
  listerTechniciens(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.base}/admin/techniciens`));
  }

  creerTechnicien(donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.base}/admin/techniciens`, donnees));
  }

  modifierTechnicien(id: number, donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.base}/admin/techniciens/${id}`, donnees));
  }

  supprimerTechnicien(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/techniciens/${id}`));
  }

  // ---- Prestations (CRUD) ----
  listerPrestationsAdmin(): Promise<any[]> {
    return firstValueFrom(this.http.get<any[]>(`${this.base}/admin/prestations`));
  }

  creerPrestation(donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.base}/admin/prestations`, donnees));
  }

  modifierPrestation(id: number, donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.base}/admin/prestations/${id}`, donnees));
  }

  supprimerPrestation(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.base}/admin/prestations/${id}`));
  }

  // ---- Utilisateurs ----
  listerUtilisateurs(
    filtres: {
      role?: string;
      recherche?: string;
      actif?: boolean;
      page?: number;
      taille?: number;
    } = {},
  ): Promise<{
    total: number;
    page: number;
    taille: number;
    elements: any[];
  }> {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '')
        params = params.set(cle, String(valeur));
    }
    return firstValueFrom(
      this.http.get<{ total: number; page: number; taille: number; elements: any[] }>(
        `${this.base}/admin/utilisateurs`,
        { params },
      ),
    );
  }

  creerUtilisateur(donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.base}/admin/utilisateurs`, donnees));
  }

  modifierUtilisateur(id: number, donnees: Record<string, unknown>): Promise<any> {
    return firstValueFrom(this.http.put<any>(`${this.base}/admin/utilisateurs/${id}`, donnees));
  }

  reinitialiserMotDePasse(id: number, nouveau: string): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.base}/admin/utilisateurs/${id}/reinitialiser-mot-de-passe`, {
        nouveau_mot_de_passe: nouveau,
      }),
    );
  }
}
