from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.documenso import is_document_signed_by_adherent
from back.messaging.matrix import send_matrix_message
from back.mongodb.db import get_db
from back.mongodb.user_models import User
from back.server.dependencies import get_user_from_user_id, must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("documenso")


@router.post("/signed")
async def _documenso_webhook(
    webhook_data: dict,
    db: AsyncIOMotorDatabase = get_db,
) -> None:
    """
    Receive a webhook from documenso. See https://docs.documenso.com/developers/webhooks.
    """

    try:
        user = User.model_validate(
            await db.users.find_one(
                {"membership.documenso_contract_id": webhook_data["payload"]["id"]}
            )
        )

        if not user.membership:
            send_matrix_message(
                f"❌ Webhook reçu pour un utilisateur sans membership : {user.first_name} {user.last_name}"
            )
            return

        # For example if the president signs the contract, it will also
        # trigger a webhook. We do not want to redo the request
        # and send a matrix message again
        if user.membership.contract_signed:
            return

        # Anyone can call this endpoint since there is not authentication needed.
        # So we do not trust the payload. Thus we check ourselves if the document
        # is signed by the user
        if is_document_signed_by_adherent(user, webhook_data["payload"]["id"]):
            user = User.model_validate(
                await db.users.find_one_and_update(
                    {"_id": str(user.id)},
                    {"$set": {"membership.contract_signed": True}},
                    return_document=ReturnDocument.AFTER,
                )
            )

            send_matrix_message(
                f"✅ Le contrat a été signé par {user.first_name} {user.last_name}"
            )

    except Exception as e:
        send_matrix_message(
            "❌ Erreur lors du traitement du webhook documenso",
            "```",
            str(e),
            "```",
            "Payload :",
            "```",
            str(webhook_data),
            "```",
        )
        raise HTTPException(
            status_code=500, detail="Error while processing webhook"
        ) from e


@router.post(
    "/refresh/{user_id}",
    dependencies=[must_be_sadh_admin],
    response_model=User,
)
async def _refresh_user(
    user: User = get_user_from_user_id,
    db: AsyncIOMotorDatabase = get_db,
):
    """
    Refresh the user's contract_signed field.
    """
    if not user.membership:
        raise HTTPException(status_code=449, detail="User has no membership")

    if not user.membership.documenso_contract_id:
        raise HTTPException(status_code=449, detail="User has no documenso contract id")

    if user.membership.contract_signed:
        return user

    if is_document_signed_by_adherent(user, user.membership.documenso_contract_id):
        user = await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {"$set": {"membership.contract_signed": True}},
            return_document=ReturnDocument.AFTER,
        )

    return user
