import dataclasses
import logging
import time
from datetime import datetime, timedelta
from urllib.parse import urljoin
from uuid import UUID

from common_models.user_models import User
from motor.motor_asyncio import AsyncIOMotorDatabase
from oauthlib.oauth2 import BackendApplicationClient
from requests_oauthlib import OAuth2Session

from back.core.helloasso_models import (
    NotificationMetadata,
    CheckoutIntentResponse,
    CheckoutItemId,
    CheckoutMetadata,
    InitCheckoutBody,
    InitCheckoutResponse,
    Payer,
    PaymentNotification,
    PaymentState,
    check_sadh_metadata_signature,
    sign_sadh_metadata,
)
from back.env import ENV
from back.messaging.matrix import send_matrix_message
from back.core.helloasso_items import CHECKOUT_ITEM_REGISTRY

_API_URL = f"{ENV.helloasso_base_url}/v5"
_TOKEN_URL = f"{ENV.helloasso_base_url}/oauth2/token"


class HelloAssoAPIClient:
    _oauth2_client: BackendApplicationClient
    _oauth2_session: OAuth2Session
    _token_url: str
    _api_url: str
    _organization_slug: str
    _client_id: str
    _client_secret: str

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        token_url: str,
        api_url: str,
        organization_slug: str,
    ):
        self._client_id = client_id
        self._client_secret = client_secret
        self._oauth2_client = BackendApplicationClient(client_id=client_id)
        self._organization_slug = organization_slug
        self._token_url = token_url
        self._api_url = api_url

        self._oauth2_session = OAuth2Session(
            client=self._oauth2_client, auto_refresh_url=self._token_url
        )

        # Don't fail the whole server if token fetch fails, we'll retry later when needed
        self.ensure_token_initialized()

    def ensure_token_initialized(self) -> None:
        # Ensure that the OAuth2 session has a valid token
        #  Necessary in case the first initialization attempt failed
        if not self._oauth2_session.token:
            self._oauth2_session.fetch_token(
                token_url=self._token_url,
                client_id=self._client_id,
                client_secret=self._client_secret,
            )

    async def get_checkout_intent(
        self, checkout_intent_id: int
    ) -> CheckoutIntentResponse | None:
        self.ensure_token_initialized()
        response = self._oauth2_session.get(
            f"{self._api_url}/organizations/{self._organization_slug}/checkout-intents/{checkout_intent_id}"
        )

        # Helloasso returns 403 if the checkout intent does not belong to the organization
        #  In that case, we treat it as not found
        if response.status_code == 404 or response.status_code == 403:
            return None

        response.raise_for_status()
        return CheckoutIntentResponse.model_validate(response.json())

    async def init_checkout[MetadataModel: NotificationMetadata](
        self,
        payer: Payer,
        item_name: str,
        total_amount: int,
        back_url: str,
        error_url: str,
        return_url: str,
        metadata: MetadataModel,
    ) -> InitCheckoutResponse:
        self.ensure_token_initialized()
        init_checkout_body = InitCheckoutBody(
            total_amount=total_amount,
            initial_amount=total_amount,
            item_name=item_name,
            back_url=back_url,
            error_url=error_url,
            return_url=return_url,
            contains_donation=False,
            payer=payer,
            metadata=metadata,
        )

        response = self._oauth2_session.post(
            f"{self._api_url}/organizations/{self._organization_slug}/checkout-intents",
            json=init_checkout_body.model_dump(by_alias=True),
        )
        response.raise_for_status()
        return InitCheckoutResponse.model_validate(response.json())


@dataclasses.dataclass
class OngoingCheckout:
    checkout_response: InitCheckoutResponse
    checkout_metadata: CheckoutMetadata
    created_at: datetime


# Cache of ongoing checkouts, to avoid creating multiple checkouts and paying multiple times by accident
_ongoing_checkouts_cache: list[OngoingCheckout] = []

# Time after which an ongoing checkout is considered expired and removed from the cache (15min according to HA docs)
CLEAR_CHECKOUT_AFTER = timedelta(minutes=15)

logger = logging.getLogger(__name__)


_ha_client: HelloAssoAPIClient | None = None


def _init_ha_client() -> HelloAssoAPIClient:
    if (
        ENV.helloasso_client_id is None
        or ENV.helloasso_client_secret is None
        or ENV.helloasso_organization_slug is None
        or ENV.helloasso_webhook_secret is None
    ):
        raise ValueError(
            "HelloAsso client ID, client secret, organization slug or helloasso webhook secret is not set in environment"
        )
    return HelloAssoAPIClient(
        ENV.helloasso_client_id,
        ENV.helloasso_client_secret,
        _TOKEN_URL,
        _API_URL,
        ENV.helloasso_organization_slug,
    )


# Singleton pattern for HelloAsso client
def get_or_init_ha_client() -> HelloAssoAPIClient:
    global _ha_client
    if _ha_client is not None:
        return _ha_client

    _ha_client = _init_ha_client()
    return _ha_client


def _create_checkout_payer_from_user(
    user: User,
) -> Payer:
    return Payer(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
    )


class UserNotEligibleError(Exception):
    def __init__(self, user_id: UUID, item_id: CheckoutItemId):
        super().__init__(f"User {user_id} is not eligible to buy item {item_id}")


class CheckoutItemDoesNotExist(Exception):
    def __init__(self, item_id: CheckoutItemId):
        super().__init__(f"Checkout item {item_id} not found")


async def init_and_cache_checkout(
    user: User,
    checkout_item_ids: list[CheckoutItemId],
    back_url: str,
    error_url: str,
    return_url: str,
) -> InitCheckoutResponse:
    """
    Initialize a HelloAsso checkout for any purpose (for now, only checkouts with one term are supported).

    Higher level function than HelloAssoAPIClient.init_checkout, it handles:
    1. item management (check that user can buy the items, compute total price, generate purchase name)
    2. creates the sadh specific metadata (to re associate the checkout with the user in the webhook)
    3. caches the ongoing checkout in memory to avoid creating multiple checkouts for the same user at the same time.

    :param return_url: URL to redirect to after successful payment, (after going through the verification screen)
    :param checkout_item_ids: list of items present in the checkout
    :param user: user to create the checkout for
    :param item_name: name of the item
    :param back_url: URL to redirect to if user goes back
    :param error_url: URL to redirect to on error
    :return: HelloAsso checkout initialization response
    """
    checkout_metadata = CheckoutMetadata(
        checkout_item_ids=checkout_item_ids, user_id=str(user.id), return_url=return_url
    )

    if ENV.helloasso_webhook_secret is None:
        raise ValueError("HelloAsso webhook secret is not set in environment")
    metadata = sign_sadh_metadata(checkout_metadata, ENV.helloasso_webhook_secret)

    # Check if the user is eligible to buy all the items
    for item_id in checkout_item_ids:
        if item_id not in CHECKOUT_ITEM_REGISTRY:
            raise CheckoutItemDoesNotExist(item_id)
        item_info = CHECKOUT_ITEM_REGISTRY[item_id]
        if not await item_info.can_user_buy(user):
            raise UserNotEligibleError(user.id, item_id)

    # Retrieve item info from their IDs
    checkout_items = [CHECKOUT_ITEM_REGISTRY[item_id] for item_id in checkout_item_ids]

    total_amount = sum(item.price for item in checkout_items)

    # Helloasso only supports one item name per checkout, so we concatenate the item names
    item_name = " + ".join(item.display_name for item in checkout_items)

    # Create the helloasso "checkout payer" object from the user
    checkout_payer = _create_checkout_payer_from_user(user)

    logger.debug("Creating HelloAsso checkout...")
    api_response = await get_or_init_ha_client().init_checkout(
        checkout_payer,
        item_name,
        total_amount,
        back_url,
        error_url,
        urljoin(ENV.sadh_base_url, "/ha-checkout-callback"),
        metadata,
    )

    # Make sure the checkout is valid, i.e. has a redirect URL, otherwise the user will be stuck for 15min with a
    #  non-working checkout
    if api_response.redirect_url:
        _ongoing_checkouts_cache.append(
            OngoingCheckout(
                checkout_response=api_response,
                checkout_metadata=checkout_metadata,
                created_at=datetime.now(),
            )
        )
    return api_response


def _clear_expired_checkouts():
    """
    Clear expired ongoing checkouts from the in-memory list
    """
    now = datetime.now()
    global _ongoing_checkouts_cache
    _ongoing_checkouts_cache = [
        checkout
        for checkout in _ongoing_checkouts_cache
        if now - checkout.created_at < CLEAR_CHECKOUT_AFTER
    ]


def clear_user_ongoing_checkouts(user_id: UUID):
    global _ongoing_checkouts_cache
    _ongoing_checkouts_cache = [
        ongoing_checkout
        for ongoing_checkout in _ongoing_checkouts_cache
        if ongoing_checkout.checkout_metadata != user_id
    ]


def get_ongoing_user_checkouts(user: User) -> list[OngoingCheckout]:
    _clear_expired_checkouts()
    return [
        ongoing_checkout
        for ongoing_checkout in _ongoing_checkouts_cache
        if ongoing_checkout.checkout_metadata.user_id == str(user.id)
    ]


async def get_ongoing_or_init_checkout(
    user: User,
    checkout_items_ids: list[CheckoutItemId],
    back_url: str,
    error_url: str,
    return_url: str,
) -> InitCheckoutResponse:
    existing_checkouts = get_ongoing_user_checkouts(user)

    for checkout in existing_checkouts:
        if all(
            item_id in checkout.checkout_metadata.checkout_item_ids
            for item_id in checkout_items_ids
        ):
            # Existing checkout found
            return checkout.checkout_response

    # No existing checkout found, create a new one
    checkout_response = await init_and_cache_checkout(
        user=user,
        checkout_item_ids=checkout_items_ids,
        back_url=back_url,
        error_url=error_url,
        return_url=return_url,
    )
    return checkout_response


async def _remove_checkout_from_cache(
    checkout_metadata: CheckoutMetadata,
) -> None:
    """Clear a checkout from the ongoing checkouts cache, after it has been processed."""
    global _ongoing_checkouts_cache
    _ongoing_checkouts_cache = [
        ongoing_checkout
        for ongoing_checkout in _ongoing_checkouts_cache
        if ongoing_checkout.checkout_metadata.user_id != checkout_metadata.user_id
        or ongoing_checkout.checkout_metadata.checkout_item_ids
        != checkout_metadata.checkout_item_ids
    ]


async def process_payment_notification(
    notification: PaymentNotification, db: AsyncIOMotorDatabase
) -> None:
    """
    Process a HelloAsso payment notification. This is called when receiving a PAYMENT notification from HelloAsso.
    We validate the payment and update the user's membership accordingly.
    :param notification: payment notification
    :param db: database
    """
    global _ongoing_checkouts_cache
    logger.debug("Processing payment notification...")
    if notification.metadata is None or notification.metadata.sadh_metadata is None:
        logger.info("Payment notification has no SADH-specific metadata, ignoring")
        return
    elif notification.metadata.sadh_metadata_sig is None:
        logger.warning("Payment notification has no SADH metadata signature, ignoring")
        return

    # Verify the signature of the metadata
    if ENV.helloasso_webhook_secret is None:
        send_matrix_message(
            f"⚠ Un webhook HelloAsso a été reçu (e.g. pour un paiement), mais le secret de webhook n'est pas configuré !\n"
            f"Il vaut le coup de vérifier HelloAsso"
        )
        logger.error(
            "HelloAsso webhook secret is not set, cannot verify metadata signature"
        )
        return
    if not check_sadh_metadata_signature(
        notification.metadata, ENV.helloasso_webhook_secret
    ):
        send_matrix_message(
            f"⚠ Un webhook HelloAsso a été reçu (e.g. pour un paiement), mais sa signature est incorrecte !"
            f"Il vaut le coup de vérifier HelloAsso"
        )
        logger.warning("Notification has invalid SADH metadata signature, ignoring")
        return

    # Minimal replay protection: check that the metadata was created more recently than max checkout lifetime
    #  Prevents attackers from re-sending old leaked notifications to re-activate memberships or similar
    if (
        time.time() - notification.metadata.sadh_metadata.issued_at
        > CLEAR_CHECKOUT_AFTER.total_seconds()
    ):
        logger.warning("Notification metadata is too old, ignoring")
        return

    match notification.metadata.sadh_metadata:
        case CheckoutMetadata() as checkout_metadata:
            userdict = await db.users.find_one({"_id": str(checkout_metadata.user_id)})
            if userdict is None:
                logger.error(
                    "User not found for payment validation: user_id=%s",
                    checkout_metadata.user_id,
                )
                send_matrix_message(
                    f"❌ Webhook reçu pour un paiement HelloAsso, mais l'utilisateur n'a pas été trouvé."
                    f"user_id={checkout_metadata.user_id}"
                )
                return
            user = User.model_validate(userdict)

            match notification.data.state:
                case PaymentState.AUTHORIZED:
                    for checkout_item_id in checkout_metadata.checkout_item_ids:
                        if checkout_item_id not in CHECKOUT_ITEM_REGISTRY:
                            send_matrix_message(
                                f"⚠ Un paiement HelloAsso contient un item inconnu et a donc été ignoré (user_id: "
                                f"{checkout_metadata.user_id}). Merci de vérifier ce paiement."
                            )
                            logger.warning(
                                "Unknown checkout item %s, ignoring",
                                checkout_item_id,
                            )
                        checkout_item = CHECKOUT_ITEM_REGISTRY[checkout_item_id]
                        await checkout_item.apply_purchase(user, db)

                case PaymentState.CONTESTED:
                    logger.warning("Payment contested for user_id=%s", user.id)
                    send_matrix_message(
                        f"⚠ Un paiement HelloAsso a été contesté par {user.first_name} {user.last_name}"
                        f"(user_id={user.id})."
                    )
                case state:
                    if state is None:
                        state_str = "None"
                    else:
                        state_str = state.value
                    send_matrix_message(
                        f"⚠ Un paiement HelloAsso est dans un état anormal ({state_str}),"
                        f"réalisé par {user.first_name} {user.last_name} (user_id={user.id})."
                    )

        case _:
            logger.info(
                "Processing metadata for %s is not implemented",
                notification.metadata.sadh_metadata.context,
            )


async def get_checkout_intent(checkout_id: int) -> CheckoutIntentResponse | None:
    # Nothing else to do for now, just call the API. Permission checks should be done by the caller
    checkout_intent = await get_or_init_ha_client().get_checkout_intent(checkout_id)
    return checkout_intent


async def is_checkout_complete(
    checkout_intent: CheckoutIntentResponse, db: AsyncIOMotorDatabase
) -> bool:
    """Check if a HelloAsso checkout intent represents a completed purchase.
    :param checkout_intent: checkout intent to check
    :param db: database

    :return: True if the purchase was completed, False otherwise.

    Useful to verify if a user has completed a purchase, to tell them the payment was OK.
    """
    # Two checks are performed:
    #   1. check that all payments are authorized (i.e. purchase is OK on helloasso side),
    #   2. check the purchase was applied (i.e. payment was processed by us)
    metadata = NotificationMetadata.model_validate(checkout_intent.metadata)
    if metadata.sadh_metadata is not None:
        # 1. Check that all payments are authorized
        payment_ok = all(
            payment.state == PaymentState.AUTHORIZED
            for payment in checkout_intent.order.payments
        )

        if not payment_ok:
            return False

        # 2. Check that the purchase took effect
        checkout_metadata: CheckoutMetadata = metadata.sadh_metadata
        userdict = await db.users.find_one({"_id": str(checkout_metadata.user_id)})
        if userdict is None:
            raise ValueError(
                f"User not found for payment validation: user_id={checkout_metadata.user_id}"
            )
        user = User.model_validate(userdict)

        for item_id in checkout_metadata.checkout_item_ids:
            if not await CHECKOUT_ITEM_REGISTRY[item_id].is_purchase_applied(user, db):
                return False
        return True

    raise ValueError("Checkout metadata not produced by SADH")


async def is_checkout_item_valid_for_user(user: User, item_id: CheckoutItemId) -> bool:
    if item_id not in CHECKOUT_ITEM_REGISTRY:
        return False

    item_info = CHECKOUT_ITEM_REGISTRY[item_id]
    return await item_info.can_user_buy(user)
