import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Erreur : Clé API introuvable dans le .env")
    exit()

client = genai.Client(api_key=api_key)

print("--- Modèles disponibles pour TA clé API ---")
for model in client.models.list():
    print(model.name)