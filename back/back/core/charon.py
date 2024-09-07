import requests

from back.env import ENV
from back.messaging.matrix import send_matrix_message


def register_ont_in_olt(ont_serial: str) -> None:
    """Register an ONT in the OLT."""
    r = requests.get(f"{ENV.charon_url}/register-onu/{ont_serial}", timeout=5)

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de l'enregistrement de l'ONT {ont_serial} dans l'OLT",
            "```",
            f"Code {r.status_code}",
            r.text,
            "```",
        )
