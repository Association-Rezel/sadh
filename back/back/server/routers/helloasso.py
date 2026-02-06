import logging
from urllib.parse import urljoin

from common_models.base import RezelBaseModel
from fastapi import APIRouter, HTTPException

from back.core.helloasso import (
    is_checkout_item_valid_for_user,
    get_ongoing_or_init_checkout,
    get_checkout_intent,
    is_checkout_complete,
    process_payment_notification,
)
from back.core.helloasso_models import (
    Notification,
    PaymentNotification,
    CheckoutItemId,
    InitCheckoutResponse,
)
from back.env import ENV
from back.mongodb.db import GetDatabase
from back.server.dependencies import RequireCurrentUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/helloasso", tags=["helloasso"])


class CheckoutHelloAssoBody(RezelBaseModel):
    checkout_item_ids: list[CheckoutItemId]


@router.post("/init_checkout")
async def _init_checkout(
    user: RequireCurrentUser,
    checkout_request: CheckoutHelloAssoBody,
    db: GetDatabase,
) -> InitCheckoutResponse:
    if not checkout_request.checkout_item_ids:
        raise HTTPException(status_code=400, detail="No checkout items provided")

    for item_id in checkout_request.checkout_item_ids:
        if not await is_checkout_item_valid_for_user(user, item_id):
            raise HTTPException(
                status_code=400,
                detail=f"One or more checkout items are not valid for this user ({item_id})",
            )

    checkout_response = await get_ongoing_or_init_checkout(
        user=user,
        back_url=urljoin(ENV.sadh_base_url, "/adherer"),
        error_url=urljoin(ENV.sadh_base_url, "/adherer"),
        checkout_items_ids=checkout_request.checkout_item_ids,
        return_url="/adherer",
    )

    if checkout_response.redirect_url is None:
        raise HTTPException(
            status_code=500, detail="HelloAsso checkout initialization failed"
        )

    return checkout_response


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
