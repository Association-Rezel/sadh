from typing import Optional, Tuple

import requests
from common_models.user_models import Address, MembershipType, User

from back.core.geo import get_postal_address
from back.env import ENV
from back.messaging.matrix import send_matrix_message


def _get_template(
    template_id: int,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> dict:
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
    }
    r = requests.get(
        f"{base_url}/api/v1/templates/{template_id}",
        headers=headers,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la récupération du template {template_id}",
            "```",
            r.text,
            "```",
        )
        raise ValueError("Error while fetching template")

    return r.json()


def _get_document(
    document_id: int,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> dict:
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
    }

    r = requests.get(
        f"{base_url}/api/v1/documents/{document_id}",
        headers=headers,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la récupération du document {document_id}",
            "```",
            r.text,
            "```",
        )
        raise ValueError("Error while fetching document")

    return r.json()


def prefill_address_in_draft(
    draft_id: int,
    address: Address,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> None:
    document_json = _get_document(draft_id)

    for field in document_json["fields"]:
        new_field_meta: Optional[dict] = None
        recipent_id = field["recipientId"]

        if (
            "fieldMeta" not in field
            or not field["fieldMeta"]
            or "label" not in field["fieldMeta"]
        ):
            continue

        if field["fieldMeta"]["label"] == "adh-address":
            new_field_meta = {
                "label": "Adresse",
                "text": "\n".join(
                    [
                        get_postal_address(address.residence),
                        f"Appartement {address.appartement_id}",
                    ]
                ),
                "readOnly": True,
            }

        if new_field_meta:
            _update_field_in_draft(
                draft_id,
                recipent_id,
                field["id"],
                new_field_meta,
                api_token=api_token,
                base_url=base_url,
            )


def _update_field_in_draft(
    draft_id: int,
    recipient_id: int,
    field_id: int,
    field_meta: dict,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> None:
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    # Ajout obligatoire de la clé discriminante 'type': 'text'
    field_meta["type"] = "text"

    body = {
        "recipientId": recipient_id,
        "type": "TEXT",
        "fieldMeta": field_meta,
    }

    r = requests.patch(
        f"{base_url}/api/v1/documents/{draft_id}/fields/{field_id}",
        json=body,
        headers=headers,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la mise à jour du champ {field_id} dans le document {draft_id}",
            f"fieldMeta: {field_meta}",
            "```",
            f"Code {r.status_code}",
            r.text,
            "```",
        )
        raise ValueError("Error while updating field")


def is_document_signed_by_adherent(
    user: User,
    document_id: int,
) -> bool:
    document_json = _get_document(document_id)

    try:
        return (
            next(
                filter(lambda x: x["email"] == user.email, document_json["recipients"])
            )["signingStatus"].lower()
            == "signed"
        )
    except StopIteration:
        send_matrix_message(
            f"❌ Erreur lors de la vérification de la signature du document {document_id}",
            "Le document n'a pas de recipient avec l'email de l'adhérent",
        )
        return False


def generate_contract_draft_for_user(
    user: User,
    membership_type: MembershipType,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> int:
    """
    Generate a draft document in Documenso for the user.

    Returns the ID of the document.
    """

    template_id: int = -1

    if membership_type == MembershipType.FTTH:
        template_id = ENV.documenso_template_contract_ftth_id

    elif membership_type == MembershipType.WIFI:
        template_id = ENV.documenso_template_contract_wifi_id

    template_json = _get_template(template_id)

    title = f"{template_json['title']} - {user.first_name} {user.last_name}"
    try:
        recipient_id = [
            recipient["id"]
            for recipient in template_json["Recipient"]
            if recipient["name"] == "adherent"
        ][0]
    except IndexError as e:
        send_matrix_message(
            f"❌ Erreur lors de la génération du contrat pour {user.email}",
            "Le template n'a pas de recipient nommé 'adherent'",
        )
        raise ValueError("Error while fetching recipient") from e

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    body = {
        "title": title,
        "recipients": [
            {
                "id": recipient_id,
                "name": user.first_name + " " + user.last_name,
                "email": user.email,
            },
        ],
    }

    r = requests.post(
        f"{base_url}/api/v1/templates/{template_id}/generate-document",
        headers=headers,
        json=body,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la génération du contrat pour {user.email}",
            "```",
            f"Code {r.status_code}",
            r.text,
            "```",
        )
        print(r.text)
        raise ValueError("Error while generating document")

    return int(r.json()["documentId"])


def create_signable_document_from_draft(
    user: User,
    draft_id: int,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> Tuple[str, str]:
    """
    Create a signable document from a draft.

    Returns a tuple with two URLs to sign the document
    respectively for the user and the president of Rezel.
    """

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    # We will get an URL for the user to sign the document
    # and display it on the website instead of sending it by email
    body = {"sendEmail": False}

    r = requests.post(
        f"{base_url}/api/v1/documents/{draft_id}/send",
        headers=headers,
        json=body,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la création du document signable pour {user.email}",
            "```",
            f"Code {r.status_code}",
            r.text,
            "```",
        )
        raise ValueError("Error while creating signable document")
    if len(r.json()["recipients"]) != 2:
        send_matrix_message(
            f"❌ Erreur lors de la création du document signable pour {user.email}",
            "Le document n'a pas exactement deux recipients",
        )
        raise ValueError("Error while creating signable document")

    adherent_url = next(
        filter(lambda x: x["email"] == user.email, r.json()["recipients"])
    )["signingUrl"]
    president_url = next(
        filter(lambda x: x["email"] != user.email, r.json()["recipients"])
    )["signingUrl"]

    return adherent_url, president_url


def delete_document(
    document_id: int,
    api_token: str = ENV.documenso_token,
    base_url: str = ENV.documenso_url,
) -> None:
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_token}",
    }

    r = requests.delete(
        f"{base_url}/api/v1/documents/{document_id}",
        headers=headers,
        timeout=5,
    )

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la suppression du document {document_id}",
            "```",
            f"Code {r.status_code}",
            r.text,
            "```",
        )
        raise ValueError("Error while deleting document")
