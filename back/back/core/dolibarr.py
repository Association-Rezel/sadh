import requests
from common_models.user_models import User
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from requests.exceptions import SSLError

from back.env import ENV
from back.messaging.matrix import send_matrix_message

TYPE_ADHERENT = "1"


async def create_dolibarr_user(
    user: User,
    db: AsyncIOMotorDatabase,
    api_token: str = ENV.dolibarr_api_token,
    base_url: str = ENV.dolibarr_base_url,
) -> User:

    if user.membership is None:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            "Le Membership de l'adhérent n'est pas défini !",
            "```",
        )
        raise ValueError("Error while adding user to dolibarr : Membership is None !")

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "DOLAPIKEY": api_token,
    }
    cotisation = 1
    typeid = TYPE_ADHERENT
    user_fai_url = f"https://fai.rezel.net/admin/users/{user.id}"
    methode_payement1 = "- par virement bancaire, voici notre RIB : IBAN : FR76 3000 4033 6400 0100 0660 667, domiciliation : BNP Paribas, BIC : BNPAFRPPXXX"
    methode_payement2 = "- en espèce ou chèque à notre local, salle 0A206 à Télécom Paris (au fond du couloir des associations, côté LudoTech/Robotics/Forum/BDS), 19 Pl. Marguerite Perey, 91120 Palaiseau"
    data = {
        "morphy": "phy",
        "typeid": typeid,
        "lastname": user.last_name,
        "firstname": user.first_name,
        "email": user.email,
        "url": user_fai_url,
        "array_options": {
            "options_cotisation": cotisation,
            "options_methode_payement1": methode_payement1,
            "options_methode_payement2": methode_payement2,
        },
    }

    if ENV.deploy_env != "prod":
        print("DEPLOY_ENV is local or dev")
        print("NOT adding member to dolibarr ! (We don't have a dolibarr dev instance)")
        return user

    try:
        r = requests.post(
            f"{base_url}/api/index.php/members",
            headers=headers,
            json=data,
            timeout=5,
        )
    except SSLError as e:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr : SSL error ! Le certificat de treso.rezel.net a peut être expiré !",
            "```",
            str(e),
            "```",
        )
        raise ValueError(
            "Error while adding user to dolibarr : SSL error ! The certificate of treso.rezel.net may have expired !"
        ) from e

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de l'ajout de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            r.text,
            "```",
        )
        raise ValueError("Error while adding user to dolibarr")

    try:
        dolibarr_id = int(r.text)
    except ValueError as e:
        raise ValueError(
            "Error while adding user to dolibarr : Dolibarr's response is not an int !"
        ) from e

    dolibarr_id = int(r.text)
    userdict = await db.users.find_one_and_update(
        {"_id": str(user.id)},
        {
            "$set": {
                "dolibarr_id": dolibarr_id,
            },
        },
        return_document=ReturnDocument.AFTER,
    )

    return User.model_validate(userdict)


def delete_dolibarr_user(
    user: User,
    api_token: str = ENV.dolibarr_api_token,
    base_url: str = ENV.dolibarr_base_url,
) -> None:

    headers = {"Accept": "application/json", "DOLAPIKEY": api_token}

    if user.dolibarr_id is None:
        send_matrix_message(
            f"❌ Erreur lors de la suppression de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            "L'adhérent n'a pas d'ID dolibarr !",
            "```",
        )
        raise ValueError(
            "Error while deleting user to dolibarr : dollibar_id is None !"
        )

    if ENV.deploy_env != "prod":
        print("DEPLOY_ENV is local or dev")
        print(
            "NOT removing member to dolibarr ! (We don't have a dolibarr dev instance)"
        )
        return

    try:
        r = requests.put(
            f"{base_url}/api/index.php/members/{user.dolibarr_id}",
            headers=headers,
            json={
                "status": "0",
                "statut": "0",
            },
            timeout=5,
        )
    except SSLError as e:
        send_matrix_message(
            f"❌ Erreur lors de la résiliation de l'adhérent {user.last_name} {user.first_name} dans dolibarr : SSL error ! Le certificat de treso.rezel.net a peut être expiré !",
            "```",
            str(e),
            "```",
        )
        raise ValueError(
            "Error while cancelling user to dolibarr : SSL error ! The certificate of treso.rezel.net may have expired !"
        ) from e

    if r.status_code != 200:
        send_matrix_message(
            f"❌ Erreur lors de la résiliation de l'adhérent {user.last_name} {user.first_name} dans dolibarr",
            "```",
            r.text,
            "```",
        )
        raise ValueError("Error while cancelling user to dolibarr")
