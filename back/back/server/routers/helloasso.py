import logging

from back.core.helloasso_models import Notification, PaymentNotification
from fastapi import APIRouter, HTTPException

from common_models.base import RezelBaseModel
from back.core.helloasso import (
    get_checkout_intent,
    is_checkout_complete,
    process_payment_notification,
)
from back.mongodb.db import GetDatabase
from back.server.dependencies import RequireCurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/helloasso", tags=["helloasso"])


@router.post("/webhook")
async def _post_helloasso_notification(
    db: GetDatabase,
    notification: Notification,
) -> None:
    """Handle HelloAsso notifications/webhooks, such as payment notification."""
    logger.debug("Received HelloAsso notification: %s", notification.eventType)

    match notification:
        case PaymentNotification():
            logger.debug("Received payment notification.")
            await process_payment_notification(notification, db)
        case _:
            logger.debug(
                "Received unknown notification type: %s. Not relevant to us, we ignore it",
                notification.eventType,
            )
    return None


class IsCheckoutCompleteResponse(RezelBaseModel):
    is_complete: bool
    return_url: str


@router.get("/get_checkout_status/{checkout_id}")
async def _get_checkout_status(
    checkout_id: int,
    user: RequireCurrentUser,
    db: GetDatabase,
) -> IsCheckoutCompleteResponse:
    """Get the status of a HelloAsso checkout by its ID."""
    if user.membership is None:
        raise HTTPException(status_code=403, detail="User has no membership")

    checkout_intent = await get_checkout_intent(checkout_id)
    if checkout_intent is None:
        raise HTTPException(status_code=404, detail="Checkout not found")
    if (
        checkout_intent.metadata is None
        or checkout_intent.metadata.sadh_metadata is None
    ):
        # Means this checkout was not created by sadh
        raise HTTPException(status_code=400, detail="Checkout is missing sadh metadata")
    if checkout_intent.metadata.sadh_metadata.user_id != str(user.id):
        raise HTTPException(status_code=403, detail="Checkout does not belong to user")

    return_url = checkout_intent.metadata.sadh_metadata.return_url
    is_complete = await is_checkout_complete(checkout_intent, db)

    return IsCheckoutCompleteResponse(is_complete=is_complete, return_url=return_url)
