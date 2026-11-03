from typing import Literal

from pydantic import BaseModel, Field

from .produit import ProduitResume


class MessageChat(BaseModel):
    role: Literal["user", "assistant"]
    contenu: str = Field(min_length=1, max_length=800)


class RequeteChat(BaseModel):
    messages: list[MessageChat] = Field(min_length=1, max_length=12)


class ContactBoutique(BaseModel):
    telephone: str
    whatsapp: str


class ReponseChat(BaseModel):
    reponse: str
    produits: list[ProduitResume] = []
    contact: ContactBoutique
    mode: Literal["ia", "simple"]