import logging
from datetime import datetime
from enum import Enum
from typing import Any

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
    sub_expired = bool(sub_end and int(sub_end) < now_ts)
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
    if kind == ReminderKind.SUBSCRIPTION:
        result, created, months = await ensure_subscription_reminder_invoice(user, db)
        send_payment_reminder_subscription(user, months)
    else:
        result, created = await ensure_membership_reminder_invoice(user, db)
        send_payment_reminder_cotisation(user)

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
