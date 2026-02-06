import logging

from common_models.user_models import MembershipType, PaymentMethod, User, DepositStatus
from motor.motor_asyncio import AsyncIOMotorDatabase


from back.core.helloasso_models import (
    CheckoutItemInfo,
)
from back.env import ENV
from back.messaging.matrix import send_matrix_message

logger = logging.getLogger(__name__)


async def _apply_first_month_membership_payment(
    user: User,
    membership_type: MembershipType,
    db: AsyncIOMotorDatabase,
) -> None:
    """
    Apply the payment of the first month of membership to the user.
    :param user: user to apply the payment to
    :param membership_type: type of membership being paid
    :param db: database
    """
    # We check that the payment is for the correct membership type
    if user.membership is None or user.membership.type != membership_type:
        logger.error(
            "User membership type mismatch for payment validation: user_id=%s",
            user.id,
        )
        send_matrix_message(
            f"❌ Webhook reçu pour un paiement HelloAsso (1er mois d'abonnement) de la part de {user.first_name} {user.last_name},"
            f"mais le type de son adhésion ({user.membership.type if user.membership is not None else "Pas d'adhésion !"})"
            f"ne correspond pas au type de paiement reçu ({membership_type}). user_id={user.id}."
            f"L'utilisateur devra peut-être être remboursé."
        )
    else:
        if user.membership.paid_first_month:
            send_matrix_message(
                f"⚠ Paiement HelloAsso reçu pour {user.first_name} {user.last_name}"
                f"(user_id={user.id}), mais le premier mois est déjà marqué comme payé.\n"
                f"L'utilisateur a peut-être été débité deux fois par erreur, veuillez "
                f"vérifier dans HelloAsso et rembourser si nécessaire.\n"
                f"(Il se peut aussi que sadh ait simplement mis trop de temps à traiter la"
                f"notif ou qu'elle se soit perdu, et que HelloAsso l'ait relancé)"
            )
        # Mark the first month as paid
        logger.debug(
            "Payment authorized for user_id=%s, marking first month as paid",
            user.id,
        )
        send_matrix_message(
            f"✅ Paiement HelloAsso reçu et validé pour {user.first_name} {user.last_name}"
            f"(user_id={user.id})."
        )
        await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "membership.paid_first_month": True,
                    "membership.init.payment_method_first_month": PaymentMethod.HELLOASSO.value,
                }
            },
        )


class _FTTHFirstMonthItem(CheckoutItemInfo):
    price = ENV.helloasso_ftth_price
    display_name = "Adhésion Fibre premier mois"

    async def can_user_buy(self, user: User) -> bool:
        return (
            user.membership is not None
            and user.membership.init is not None
            and user.membership.type == MembershipType.FTTH
            and not user.membership.paid_first_month
        )

    async def apply_purchase(self, user: User, db: AsyncIOMotorDatabase):
        return await _apply_first_month_membership_payment(
            user, MembershipType.FTTH, db
        )

    async def is_purchase_applied(self, user: User, db: AsyncIOMotorDatabase) -> bool:
        return user.membership is not None and user.membership.paid_first_month


class _WiFiFirstMonthItem(CheckoutItemInfo):
    price = ENV.helloasso_wifi_price
    display_name = "Adhésion WIFI premier mois"

    async def can_user_buy(self, user: User) -> bool:
        return (
            user.membership is not None
            and user.membership.init is not None
            and user.membership.type == MembershipType.WIFI
            and not user.membership.paid_first_month
        )

    async def apply_purchase(self, user: User, db: AsyncIOMotorDatabase):
        return await _apply_first_month_membership_payment(
            user, MembershipType.WIFI, db
        )

    async def is_purchase_applied(self, user: User, db: AsyncIOMotorDatabase) -> bool:
        return user.membership is not None and user.membership.paid_first_month


class _FTTHDepositItem(CheckoutItemInfo):
    price = ENV.helloasso_ftth_deposit_price
    display_name = "Caution matériel FTTH"

    async def can_user_buy(self, user: User) -> bool:
        return (
            user.membership is not None
            and user.membership.init is not None
            and user.membership.type == MembershipType.FTTH
            and user.membership.deposit_status == DepositStatus.NOT_DEPOSITED
        )

    async def is_purchase_applied(self, user: User, db: AsyncIOMotorDatabase) -> bool:
        return (
            user.membership is not None
            and user.membership.deposit_status == DepositStatus.PAID
        )

    async def apply_purchase(self, user: User, db: AsyncIOMotorDatabase) -> None:
        """
        Apply the payment of the deposit to the user.
        :param user: user to apply the payment to
        :param db: database
        """
        if user.membership is None or user.membership.type != MembershipType.FTTH:
            logger.error(
                "User has no membership for deposit payment validation: user_id=%s",
                user.id,
            )
            send_matrix_message(
                f"❌ Webhook reçu pour un paiement par HelloAsso (Caution) de la part de {user.first_name} {user.last_name},"
                f"mais l'utilisateur n'a pas d'adhésion FTTH. user_id={user.id}."
                f"L'utilisateur devra peut-être être remboursé."
            )
        else:
            if user.membership.deposit_status != DepositStatus.NOT_DEPOSITED:
                send_matrix_message(
                    f"⚠ Paiement HelloAsso reçu pour {user.first_name} {user.last_name}"
                    f"(user_id={user.id}), mais la caution est déjà marquée comme payée.\n"
                    f"L'utilisateur a peut-être été débité deux fois par erreur, veuillez"
                    f"vérifier dans HelloAsso et rembourser si nécessaire.\n"
                    f"(Il se peut aussi que sadh ait simplement mis trop de temps à traiter la"
                    f"notif ou qu'elle se soit perdu, et que HelloAsso l'ait relancé)"
                )
            # Mark the deposit as paid
            logger.debug(
                "Deposit payment authorized for user_id=%s, marking deposit as paid",
                user.id,
            )
            send_matrix_message(
                f"✅ Paiement HelloAsso reçu et validé pour la caution de {user.first_name} {user.last_name}"
                f"(user_id={user.id})."
            )
            await db.users.find_one_and_update(
                {"_id": str(user.id)},
                {
                    "$set": {
                        "membership.deposit_status": DepositStatus.PAID.value,
                    }
                },
            )


class _MembershipItem(CheckoutItemInfo):
    price = ENV.helloasso_membership_price
    display_name = "Adhésion"

    async def can_user_buy(self, user: User) -> bool:
        if user.membership is None:
            return False
        return not user.membership.paid_membership

    async def apply_purchase(self, user: User, db: AsyncIOMotorDatabase) -> None:
        await db.users.find_one_and_update(
            {"_id": str(user.id)},
            {
                "$set": {
                    "membership.paid_membership": True,
                }
            },
        )

    async def is_purchase_applied(self, user: User, db: AsyncIOMotorDatabase) -> bool:
        if user.membership is None:
            return False
        return user.membership.paid_membership


CHECKOUT_ITEM_REGISTRY: dict[str, CheckoutItemInfo] = {
    "FIRST_MONTH_FTTH": _FTTHFirstMonthItem(),
    "FIRST_MONTH_WIFI": _WiFiFirstMonthItem(),
    "FTTH_DEPOSIT": _FTTHDepositItem(),
    "MEMBERSHIP": _MembershipItem(),
}
