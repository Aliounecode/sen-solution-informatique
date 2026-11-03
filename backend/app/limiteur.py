import threading
import time
from collections import defaultdict, deque

from fastapi import Depends, HTTPException, Request, status


class LimiteurDebit:
    """Limiteur à fenêtre glissante, en mémoire (suffisant pour une instance unique)."""

    def __init__(self, maximum: int, fenetre_secondes: int) -> None:
        self.maximum = maximum
        self.fenetre = fenetre_secondes
        self._acces: dict[str, deque[float]] = defaultdict(deque)
        self._verrou = threading.Lock()

    def verifier(self, cle: str) -> None:
        maintenant = time.monotonic()
        with self._verrou:
            if len(self._acces) > 10_000:
                self._nettoyer(maintenant)
            file = self._acces[cle]
            while file and maintenant - file[0] > self.fenetre:
                file.popleft()
            if len(file) >= self.maximum:
                raise HTTPException(
                    status.HTTP_429_TOO_MANY_REQUESTS,
                    "Trop de requêtes. Réessayez dans un instant.",
                )
            file.append(maintenant)

    def _nettoyer(self, maintenant: float) -> None:
        for cle in [c for c, f in self._acces.items() if not f or maintenant - f[-1] > self.fenetre]:
            del self._acces[cle]

    def reinitialiser(self) -> None:
        with self._verrou:
            self._acces.clear()


def limiter(limiteur: LimiteurDebit):
    def dependance(requete: Request) -> None:
        hote = requete.client.host if requete.client else "inconnu"
        limiteur.verifier(hote)

    return Depends(dependance)