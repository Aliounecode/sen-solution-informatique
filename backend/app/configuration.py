from pydantic_settings import BaseSettings, SettingsConfigDict


class Parametres(BaseSettings):
    URL_BASE_DONNEES: str
    CLE_SECRETE: str
    ALGORITHME: str = "HS256"
    DUREE_TOKEN_ACCES_MINUTES: int = 30
    DUREE_TOKEN_RAFRAICHISSEMENT_JOURS: int = 7
    ORIGINES_CORS: str = "http://localhost:4200"

    # Cloudinary (téléversement d'images)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_DOSSIER: str = "sen-solution-informatique"

    # Brevo (e-mails transactionnels)
    BREVO_API_KEY: str = ""
    BREVO_EXPEDITEUR_EMAIL: str = ""
    BREVO_EXPEDITEUR_NOM: str = "Sen Solution Informatique"

    #Chat Bot Parametre
    ANTHROPIC_API_KEY: str = ""
    CHATBOT_MODELE: str = "claude-haiku-5-5"
    BOUTIQUE_TELEPHONE: str = ""
    BOUTIQUE_WHATSAPP: str = ""
    BOUTIQUE_ADRESSE: str = ""
    BOUTIQUE_HORAIRES: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def liste_origines_cors(self) -> list[str]:
        return [o.strip() for o in self.ORIGINES_CORS.split(",") if o.strip()]


parametres = Parametres()