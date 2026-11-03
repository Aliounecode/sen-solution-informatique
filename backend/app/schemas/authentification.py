from pydantic import BaseModel


class Jeton(BaseModel):
    token_acces: str
    token_rafraichissement: str
    type_jeton: str = "bearer"


class RafraichirRequete(BaseModel):
    token_rafraichissement: str
