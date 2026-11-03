import httpx

from ..configuration import parametres

_URL_BREVO = "https://api.brevo.com/v3/smtp/email"

_STATUT_COMMANDE = {
    "nouvelle": "reçue", "validee": "validée", "refusee": "refusée", "annulee": "annulée",
}
_STATUT_DEMANDE = {
    "recue": "reçue", "diagnostic": "en diagnostic", "devis": "en attente de votre devis",
    "en_reparation": "en réparation", "prete": "prête à être récupérée",
    "livree": "récupérée", "annulee": "annulée",
}


def _configure() -> bool:
    return bool(parametres.BREVO_API_KEY and parametres.BREVO_EXPEDITEUR_EMAIL)


def _fcfa(montant: int | None) -> str:
    if montant is None:
        return "sur devis"
    return f"{montant:,}".replace(",", " ") + " FCFA"


def _cadre(titre: str, corps: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2933">
      <h2 style="color:#0a7ea4">{titre}</h2>
      {corps}
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0"/>
      <p style="font-size:12px;color:#8b97a6">Sen Solution Informatique — vente &amp; dépannage informatique, Dakar</p>
    </div>
    """


def _envoyer(email: str | None, nom: str | None, sujet: str, html: str) -> None:
    """Envoi best-effort : n'interrompt jamais le flux applicatif."""
    if not _configure() or not email:
        return
    charge = {
        "sender": {"email": parametres.BREVO_EXPEDITEUR_EMAIL, "name": parametres.BREVO_EXPEDITEUR_NOM},
        "to": [{"email": email, "name": nom or email}],
        "subject": sujet,
        "htmlContent": html,
    }
    try:
        httpx.post(
            _URL_BREVO,
            json=charge,
            headers={"api-key": parametres.BREVO_API_KEY, "accept": "application/json"},
            timeout=10.0,
        )
    except Exception:
        pass


# ---- Commandes ----
def confirmation_commande(
    email: str | None, nom: str, reference: str, montant_total: int,
    lignes: list[tuple[int, str, int]],
) -> None:
    articles = "".join(
        f"<tr><td style='padding:4px 8px'>{q} × {n}</td>"
        f"<td style='padding:4px 8px;text-align:right'>{_fcfa(st)}</td></tr>"
        for q, n, st in lignes
    )
    corps = f"""
      <p>Bonjour {nom},</p>
      <p>Votre commande <strong>{reference}</strong> a bien été enregistrée.</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">{articles}
        <tr><td style='padding:8px;border-top:1px solid #e0e0e0'><strong>Total</strong></td>
        <td style='padding:8px;border-top:1px solid #e0e0e0;text-align:right'><strong>{_fcfa(montant_total)}</strong></td></tr>
      </table>
      <p>Suivez votre commande à tout moment avec la référence <strong>{reference}</strong>.</p>
    """
    _envoyer(email, nom, f"Votre commande {reference}", _cadre("Commande enregistrée", corps))


def notification_statut_commande(
    email: str | None, nom: str, reference: str, statut: str, montant_total: int,
) -> None:
    libelle = _STATUT_COMMANDE.get(statut, statut)
    corps = f"""
      <p>Bonjour {nom},</p>
      <p>Votre commande <strong>{reference}</strong> ({_fcfa(montant_total)}) est désormais <strong>{libelle}</strong>.</p>
    """
    _envoyer(email, nom, f"Commande {reference} — {libelle}", _cadre("Suivi de commande", corps))


# ---- Demandes de dépannage ----
def confirmation_demande(email: str | None, nom: str, reference: str, type_appareil: str) -> None:
    corps = f"""
      <p>Bonjour {nom},</p>
      <p>Votre demande de dépannage <strong>{reference}</strong> pour votre {type_appareil} a bien été reçue.</p>
      <p>Nous établissons un diagnostic et revenons vers vous. Suivez l'avancement avec la référence <strong>{reference}</strong>.</p>
    """
    _envoyer(email, nom, f"Demande de dépannage {reference}", _cadre("Demande enregistrée", corps))


def notification_statut_demande(
    email: str | None, nom: str, reference: str, statut: str,
    diagnostic: str | None, montant_devis: int | None,
) -> None:
    libelle = _STATUT_DEMANDE.get(statut, statut)
    extra = ""
    if statut == "diagnostic" and diagnostic:
        extra = f"<p><strong>Diagnostic :</strong> {diagnostic}</p>"
    elif statut == "devis" and montant_devis is not None:
        extra = (
            f"<p><strong>Devis : {_fcfa(montant_devis)}</strong></p>"
            "<p>Connectez-vous à votre suivi pour accepter ou refuser le devis.</p>"
        )
    corps = f"""
      <p>Bonjour {nom},</p>
      <p>Votre demande <strong>{reference}</strong> est désormais <strong>{libelle}</strong>.</p>
      {extra}
    """
    _envoyer(email, nom, f"Dépannage {reference} — {libelle}", _cadre("Suivi de dépannage", corps))