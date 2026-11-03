"""Remplit la base avec des données d'exemple (idempotent : relançable sans doublon).

Usage (venv activé, depuis backend/) :
    python remplir_donnees.py
"""
from datetime import datetime, timezone

from sqlalchemy import func, select

from app.base_donnees import SessionLocale
from app.modeles import (
    Categorie,
    Commande,
    DefinitionSpecification,
    DemandeDepannage,
    ImageProduit,
    LigneCommande,
    ModeRetrait,
    MoyenPaiement,
    Prestation,
    Produit,
    StatutCommande,
    StatutDemande,
    Technicien,
    TypeProduit,
    TypeValeur,
)
from app.utilitaires import slugifier


def _categorie(session, nom, parent=None, ordre=0):
    existe = session.scalar(select(Categorie).where(Categorie.nom == nom))
    if existe:
        return existe
    c = Categorie(nom=nom, slug=slugifier(nom), parent_id=parent.id if parent else None, ordre=ordre)
    session.add(c)
    session.flush()
    return c


def _specification(session, cle, libelle, groupe, type_valeur, unite=None, options=None, ordre=0):
    existe = session.scalar(select(DefinitionSpecification).where(DefinitionSpecification.cle == cle))
    if existe:
        return existe
    s = DefinitionSpecification(
        cle=cle, libelle=libelle, groupe=groupe, type_valeur=type_valeur,
        unite=unite, options=options, ordre=ordre,
    )
    session.add(s)
    session.flush()
    return s


def _produit(session, reference, nom, categorie, type_produit, prix, stock, **extra):
    existe = session.scalar(select(Produit).where(Produit.reference == reference))
    if existe:
        return existe
    image = extra.pop("image", None)
    p = Produit(
        reference=reference, nom=nom, slug=slugifier(nom), categorie_id=categorie.id,
        type_produit=type_produit, prix=prix, quantite_stock=stock, **extra,
    )
    session.add(p)
    session.flush()
    if image:
        session.add(ImageProduit(produit_id=p.id, url=image, est_principale=True))
    return p


def _prestation(session, nom, tarif, duree=None, description=None, ordre=0):
    existe = session.scalar(select(Prestation).where(Prestation.nom == nom))
    if existe:
        return existe
    pr = Prestation(
        nom=nom, slug=slugifier(nom), tarif=tarif, duree_estimee=duree,
        description=description, ordre=ordre,
    )
    session.add(pr)
    session.flush()
    return pr


def _technicien(session, nom, telephone, specialite):
    existe = session.scalar(select(Technicien).where(Technicien.nom == nom))
    if existe:
        return existe
    t = Technicien(nom=nom, telephone=telephone, specialite=specialite)
    session.add(t)
    session.flush()
    return t


def principal():
    session = SessionLocale()
    try:
        # ---- Catégories (hiérarchie) ----
        ordis = _categorie(session, "Ordinateurs", ordre=1)
        portables = _categorie(session, "Ordinateurs portables", parent=ordis, ordre=1)
        bureau = _categorie(session, "Ordinateurs de bureau", parent=ordis, ordre=2)
        accessoires = _categorie(session, "Accessoires", ordre=2)
        peripheriques = _categorie(session, "Périphériques", parent=accessoires, ordre=1)
        composants = _categorie(session, "Composants", parent=accessoires, ordre=2)

        # ---- Spécifications ----
        _specification(session, "processeur", "Processeur", "Performance", TypeValeur.texte, ordre=1)
        _specification(session, "ram", "Mémoire vive", "Performance", TypeValeur.nombre, unite="Go", ordre=2)
        _specification(session, "stockage", "Stockage", "Performance", TypeValeur.texte, ordre=3)
        _specification(session, "carte_graphique", "Carte graphique", "Performance", TypeValeur.texte, ordre=4)
        _specification(session, "ecran", "Écran", "Affichage", TypeValeur.texte, ordre=5)
        _specification(session, "systeme", "Système", "Système", TypeValeur.liste,
                       options=["Windows", "Linux", "Sans OS"], ordre=6)

        # ---- Produits ----
        _produit(
            session, "PC-ASUS-VIVO15", "Asus VivoBook 15", portables, TypeProduit.ordinateur,
            prix=450000, stock=8, prix_promo=420000, marque="Asus", modele="X1504",
            description="Ordinateur portable 15,6 pouces, léger et polyvalent.",
            en_vedette=True, image="https://picsum.photos/seed/vivobook/800/600",
            caracteristiques={"processeur": "Intel Core i5-1235U", "ram": 16,
                              "stockage": "512 Go SSD", "ecran": '15.6" Full HD', "systeme": "Windows"},
        )
        _produit(
            session, "PC-HP-PAV", "HP Pavilion Desktop", bureau, TypeProduit.ordinateur,
            prix=550000, stock=4, marque="HP", modele="TP01",
            description="Tour de bureau performante pour le travail quotidien.",
            image="https://picsum.photos/seed/pavilion/800/600",
            caracteristiques={"processeur": "AMD Ryzen 5 5600G", "ram": 8,
                              "stockage": "1 To HDD", "systeme": "Windows"},
        )
        _produit(
            session, "PC-DELL-LAT", "Dell Latitude 5420", portables, TypeProduit.ordinateur,
            prix=380000, stock=6, prix_promo=350000, marque="Dell", modele="5420",
            description="Portable professionnel robuste, autonomie confortable.",
            en_vedette=True, image="https://picsum.photos/seed/latitude/800/600",
            caracteristiques={"processeur": "Intel Core i5-1145G7", "ram": 8,
                              "stockage": "256 Go SSD", "ecran": '14" Full HD', "systeme": "Windows"},
        )
        _produit(
            session, "SOU-LOGI-M90", "Souris Logitech M90", peripheriques, TypeProduit.accessoire,
            prix=8000, stock=30, marque="Logitech",
            description="Souris filaire USB, prise en main confortable.",
            image="https://picsum.photos/seed/souris/800/600",
        )
        _produit(
            session, "CLA-HP-K200", "Clavier HP K200", peripheriques, TypeProduit.accessoire,
            prix=12000, stock=20, marque="HP",
            description="Clavier filaire AZERTY, silencieux.",
            image="https://picsum.photos/seed/clavier/800/600",
        )
        _produit(
            session, "SSD-SAM-1TO", "SSD Samsung 870 EVO 1 To", composants, TypeProduit.accessoire,
            prix=60000, stock=15, marque="Samsung",
            description="Disque SSD SATA 2,5 pouces, 1 To.",
            image="https://picsum.photos/seed/ssd/800/600",
            caracteristiques={"stockage": "1 To SSD"},
        )

        # ---- Prestations de dépannage ----
        _prestation(session, "Diagnostic complet", 5000, "30-60 min",
                    "Analyse matérielle et logicielle de votre appareil.", ordre=1)
        _prestation(session, "Réinstallation système", 15000, "24h",
                    "Formatage et réinstallation propre du système d'exploitation.", ordre=2)
        _prestation(session, "Nettoyage & dépoussiérage", 10000, "1-2h",
                    "Nettoyage interne, remplacement de la pâte thermique.", ordre=3)
        _prestation(session, "Remplacement d'écran", None, "48-72h",
                    "Changement d'écran (tarif selon modèle).", ordre=4)
        _prestation(session, "Récupération de données", None, "48-72h",
                    "Tentative de récupération de fichiers sur disque défaillant.", ordre=5)

        # ---- Techniciens ----
        modou = _technicien(session, "Modou Fall", "77 123 45 67", "Hardware / composants")
        _technicien(session, "Awa Ndiaye", "76 234 56 78", "Systèmes & réseaux")
        _technicien(session, "Ibrahima Sarr", "70 345 67 89", "Logiciel & récupération de données")

        # ---- Exemple : demandes de dépannage (seulement si aucune) ----
        if session.scalar(select(func.count()).select_from(DemandeDepannage)) == 0:
            d1 = DemandeDepannage(
                reference="", nom_client="Fatou Ba", telephone_client="77 555 11 22",
                email_client=None, type_appareil="PC portable", marque_appareil="HP",
                description_panne="L'ordinateur ne démarre plus, écran noir au démarrage.",
                statut=StatutDemande.recue,
            )
            session.add(d1)
            session.flush()
            d1.reference = f"DEP-{datetime.now(timezone.utc).year}-{d1.id:05d}"

            d2 = DemandeDepannage(
                reference="", nom_client="Cheikh Diop", telephone_client="70 666 33 44",
                type_appareil="PC de bureau", marque_appareil="Dell",
                description_panne="Très lent et bruyant depuis quelques semaines.",
                statut=StatutDemande.devis, diagnostic="Ventilateur encrassé + disque presque plein.",
                montant_devis=18000, technicien_id=modou.id,
            )
            session.add(d2)
            session.flush()
            d2.reference = f"DEP-{datetime.now(timezone.utc).year}-{d2.id:05d}"

        # ---- Exemple : une commande validée (seulement si aucune) ----
        if session.scalar(select(func.count()).select_from(Commande)) == 0:
            asus = session.scalar(select(Produit).where(Produit.reference == "PC-ASUS-VIVO15"))
            souris = session.scalar(select(Produit).where(Produit.reference == "SOU-LOGI-M90"))
            if asus and souris:
                prix_asus = asus.prix_promo or asus.prix
                lignes = [
                    LigneCommande(produit_id=asus.id, nom_produit=asus.nom,
                                  reference_produit=asus.reference, prix_unitaire=prix_asus,
                                  quantite=1, sous_total=prix_asus),
                    LigneCommande(produit_id=souris.id, nom_produit=souris.nom,
                                  reference_produit=souris.reference, prix_unitaire=souris.prix,
                                  quantite=2, sous_total=souris.prix * 2),
                ]
                total = sum(l.sous_total for l in lignes)
                commande = Commande(
                    reference="", nom_client="Aminata Sow", telephone_client="78 777 88 99",
                    email_client=None, mode_retrait=ModeRetrait.retrait_boutique,
                    moyen_paiement=MoyenPaiement.wave, statut=StatutCommande.validee,
                    montant_total=total, lignes=lignes,
                )
                session.add(commande)
                session.flush()
                commande.reference = f"CMD-{datetime.now(timezone.utc).year}-{commande.id:05d}"
                asus.quantite_stock -= 1
                souris.quantite_stock -= 2

        session.commit()

        for modele, libelle in [
            (Categorie, "catégories"), (DefinitionSpecification, "spécifications"),
            (Produit, "produits"), (Prestation, "prestations"), (Technicien, "techniciens"),
            (DemandeDepannage, "demandes"), (Commande, "commandes"),
        ]:
            nombre = session.scalar(select(func.count()).select_from(modele))
            print(f"  {libelle:.<20} {nombre}")
        print("Données d'exemple en place.")
    finally:
        session.close()


if __name__ == "__main__":
    principal()