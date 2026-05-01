import logging
from datetime import datetime

from typing import Any

from common_models.base import RezelBaseModel
from common_models.user_models import User
from fastapi import APIRouter, Depends, HTTPException

from back.core.auto_invoicing import run_auto_invoicing
from back.core.overdue import (
    ReminderKind,
    list_overdue_users,
    remind,
)
from back.mongodb.db import GetDatabase
from back.server.dependencies import UserFromPath, must_be_admin

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/overdue",
    tags=["overdue"],
    dependencies=[Depends(must_be_admin)],
)


class OverdueEntry(RezelBaseModel):
    user: User
    amount_owed: float
    last_reminder_at: datetime | None = None


class OverdueListResponse(RezelBaseModel):
    subscription_expired: list[OverdueEntry]
    cotisation_expired: list[OverdueEntry]


class ReminderResult(RezelBaseModel):
    user_id: str
    invoice_id: int | None
    invoice_created: bool = False
    mail_sent: bool


@router.get("/", response_model=OverdueListResponse)
async def _list_overdue(db: GetDatabase) -> OverdueListResponse:
    data = await list_overdue_users(db)
    return OverdueListResponse(
        subscription_expired=data[ReminderKind.SUBSCRIPTION],
        cotisation_expired=data[ReminderKind.MEMBERSHIP],
    )


async def _remind_one(user: User, db, kind: ReminderKind) -> ReminderResult:
    try:
        res = await remind(user, db, kind)
    except Exception as e:
        logger.error("Error reminding %s for %s: %s", kind.value, user.id, e)
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la création de la facture / envoi mail",
        ) from e
    return ReminderResult(**res)


@router.post("/{user_id}/remind-subscription", response_model=ReminderResult)
async def remind_subscription_endpoint(
    user: UserFromPath, db: GetDatabase
) -> ReminderResult:
    return await _remind_one(user, db, ReminderKind.SUBSCRIPTION)


@router.post("/{user_id}/remind-cotisation", response_model=ReminderResult)
async def remind_cotisation_endpoint(
    user: UserFromPath, db: GetDatabase
) -> ReminderResult:
    return await _remind_one(user, db, ReminderKind.MEMBERSHIP)


async def remind_all(db, kind: ReminderKind) -> list[ReminderResult]:
    data = await list_overdue_users(db)
    results: list[ReminderResult] = []
    for entry in data[kind]:
        user = entry["user"]
        try:
            res = await remind(user, db, kind)
            results.append(ReminderResult(**res))
        except Exception as e:
            logger.error("Error reminding %s for %s: %s", kind.value, user.id, e)
    return results


@router.post("/remind-all-subscription", response_model=list[ReminderResult])
async def remind_all_subscription(db: GetDatabase) -> list[ReminderResult]:
    return await remind_all(db, ReminderKind.SUBSCRIPTION)


@router.post("/remind-all-cotisation", response_model=list[ReminderResult])
async def remind_all_cotisation(db: GetDatabase) -> list[ReminderResult]:
    return await remind_all(db, ReminderKind.MEMBERSHIP)


@router.post("/trigger-job")
async def trigger_job(db: GetDatabase) -> dict[str, Any]:
    return await run_auto_invoicing(db)
