import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from back.core.dolibarr import (
    compute_subscription_info,
    ensure_membership_reminder_invoice,
    ensure_subscription_reminder_invoice,
)
from back.core.overdue import active_users
from back.messaging.matrix import send_matrix_message

logger = logging.getLogger(__name__)

DAYS_BEFORE_EXPIRATION = 7
RUN_HOUR = 3


async def run_auto_invoicing(db: AsyncIOMotorDatabase) -> dict[str, Any]:
    threshold_ts = int(datetime.now().timestamp()) + DAYS_BEFORE_EXPIRATION * 86400

    created_subscription = 0
    created_membership = 0
    errors = 0

    users = await active_users(db)
    logger.info("auto_invoicing: scanning %d active users", len(users))

    for user in users:
        try:
            info = compute_subscription_info(user)
            if info is None:
                continue
            sub_end = info.get("subscription_end")
            mem_end = info.get("membership_end")

            if sub_end is not None and int(sub_end) <= threshold_ts:
                result, created, months = await ensure_subscription_reminder_invoice(
                    user, db
                )
                if created and result is not None:
                    created_subscription += 1
                    logger.info(
                        "auto_invoicing: created subscription invoice %s "
                        "(%d mois) for user %s",
                        result.get("invoice_id"),
                        months,
                        user.id,
                    )

            if mem_end is not None and int(mem_end) <= threshold_ts:
                result, created = await ensure_membership_reminder_invoice(user, db)
                if created and result is not None:
                    created_membership += 1
                    logger.info(
                        "auto_invoicing: created membership invoice %s for user %s",
                        result.get("invoice_id"),
                        user.id,
                    )
        except Exception as e:
            errors += 1
            logger.exception("auto_invoicing: error processing user %s: %s", user.id, e)

    summary = {
        "users_scanned": len(users),
        "created_subscription": created_subscription,
        "created_membership": created_membership,
        "errors": errors,
    }
    logger.info("auto_invoicing run done: %s", summary)
    return summary


def _seconds_until_next_run() -> int:
    now = datetime.now()
    target = now.replace(hour=RUN_HOUR, minute=0, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return int((target - now).total_seconds())


async def auto_invoicing_loop(db: AsyncIOMotorDatabase) -> None:
    logger.info("auto_invoicing loop started (daily at %02d:00)", RUN_HOUR)
    while True:
        try:
            await asyncio.sleep(_seconds_until_next_run())
        except asyncio.CancelledError:
            raise
        try:
            await run_auto_invoicing(db)
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.exception("auto_invoicing loop: unexpected error: %s", e)
            try:
                send_matrix_message(
                    "❌ auto_invoicing : erreur inattendue dans la boucle",
                    "```",
                    str(e),
                    "```",
                )
            except Exception:
                pass
