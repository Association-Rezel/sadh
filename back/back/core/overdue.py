import logging
from datetime import datetime
from enum import Enum
from typing import Any

from babel.dates import format_datetime
from common_models.user_models import MembershipStatus, User
from motor.motor_asyncio import AsyncIOMotorDatabase

from back.core.dolibarr import (
    compute_subscription_info,
    ensure_membership_reminder_invoice,
    ensure_subscription_reminder_invoice,
    find_unpaid_invoice_for,
)
from back.messaging.mails import (
    send_payment_reminder_cotisation,
    send_payment_reminder_subscription,
)

logger = logging.getLogger(__name__)


class ReminderKind(str, Enum):
    SUBSCRIPTION = "subscription"
    MEMBERSHIP = "membership"


async def active_users(db: AsyncIOMotorDatabase) -> list[User]:
    users_raw = await db.users.find(
        {
            "dolibarr_id": {"$ne": None},
            "membership.status": {
                "$in": [
                    MembershipStatus.ACTIVE.value,
                    MembershipStatus.PENDING_INACTIVE.value,
                ]
            },
        }
    ).to_list(None)
    return [User.model_validate(u) for u in users_raw]


def _classify(user: User, now_ts: int) -> tuple[bool, bool]:
    info = compute_subscription_info(user)
    if info is None:
        return (False, False)
    sub_end = info.get("subscription_end")
    mem_end = info.get("membership_end")
    inactive_ts = None
    if user.membership and user.membership.inactive_date is not None:
        dt = user.membership.inactive_date
        inactive_ts = int(dt) if isinstance(dt, (int, float)) else int(dt.timestamp())
    reference_ts = inactive_ts if inactive_ts and inactive_ts <= now_ts else now_ts
    sub_expired = bool(sub_end and int(sub_end) < reference_ts)
    cot_expired = bool(mem_end and int(mem_end) < now_ts)
    return (sub_expired, cot_expired)


def _amount_owed(user: User, kind: ReminderKind) -> float:
    inv = find_unpaid_invoice_for(user, kind.value)
    if inv is None:
        return 0.0
    try:
        return float(inv.get("remaintopay") or 0)
    except (TypeError, ValueError):
        return 0.0


async def _enrich(
    user: User, kind: ReminderKind, db: AsyncIOMotorDatabase
) -> dict[str, Any]:
    field = f"last_reminder_{kind.value}_at"
    raw = await db.users.find_one({"_id": str(user.id)}, {field: 1})
    return {
        "user": user,
        "amount_owed": _amount_owed(user, kind),
        "last_reminder_at": (raw or {}).get(field),
    }


async def list_overdue_users(
    db: AsyncIOMotorDatabase,
) -> dict[ReminderKind, list[dict[str, Any]]]:
    users = await active_users(db)
    now_ts = int(datetime.now().timestamp())
    buckets: dict[ReminderKind, list[dict[str, Any]]] = {
        ReminderKind.SUBSCRIPTION: [],
        ReminderKind.MEMBERSHIP: [],
    }
    for u in users:
        # Ignorer complètement les utilisateurs dont l'abonnement est terminé (inactive_date passée)
        inactive_ts = None
        if u.membership and u.membership.inactive_date is not None:
            dt = u.membership.inactive_date
            inactive_ts = (
                int(dt) if isinstance(dt, (int, float)) else int(dt.timestamp())
            )

        if inactive_ts and inactive_ts <= now_ts:
            logger.debug(
                "Skipping overdue check for user %s (subscription inactive since %s)",
                u.id,
                datetime.fromtimestamp(inactive_ts).date(),
            )
            continue

        try:
            sub, cot = _classify(u, now_ts)
        except Exception as e:
            logger.error("Error classifying overdue for user %s: %s", u.id, e)
            continue
        if sub:
            entry = await _enrich(u, ReminderKind.SUBSCRIPTION, db)
            if entry.get("amount_owed", 0) > 0:
                buckets[ReminderKind.SUBSCRIPTION].append(entry)
        if cot:
            entry = await _enrich(u, ReminderKind.MEMBERSHIP, db)
            if entry.get("amount_owed", 0) > 0:
                buckets[ReminderKind.MEMBERSHIP].append(entry)
    return buckets


async def remind(
    user: User, db: AsyncIOMotorDatabase, kind: ReminderKind
) -> dict[str, Any]:
    info = compute_subscription_info(user)
    expiration_ts = (
        info.get("subscription_end")
        if info and kind == ReminderKind.SUBSCRIPTION
        else info.get("membership_end") if info else None
    )
    expiration_date = None
    if expiration_ts:
        expiration_date = format_datetime(
            datetime.fromtimestamp(int(expiration_ts)),
            "d MMMM yyyy",
            locale="fr_FR",
        )

    if kind == ReminderKind.SUBSCRIPTION:
        result, created, _ = await ensure_subscription_reminder_invoice(user, db)
        amount = _amount_owed(user, ReminderKind.SUBSCRIPTION)
        send_payment_reminder_subscription(
            user,
            amount=amount,
            expiration_date=expiration_date,
        )
    else:
        result, created = await ensure_membership_reminder_invoice(user, db)
        amount = _amount_owed(user, ReminderKind.MEMBERSHIP)
        send_payment_reminder_cotisation(
            user,
            amount=amount,
            expiration_date=expiration_date,
        )

    await db.users.update_one(
        {"_id": str(user.id)},
        {"$set": {f"last_reminder_{kind.value}_at": datetime.now()}},
    )

    return {
        "user_id": str(user.id),
        "invoice_id": result.get("invoice_id") if result else None,
        "invoice_created": created,
        "mail_sent": True,
    }
