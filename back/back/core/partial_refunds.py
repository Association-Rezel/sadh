import logging
from datetime import datetime
from uuid import uuid4

import pytz
from common_models.partial_refund import PartialRefund
from common_models.user_models import (
    AttachedWifiAdherent,
    MembershipStatus,
    MembershipType,
    User,
)
from motor.motor_asyncio import AsyncIOMotorDatabase


class Result:
    failed_ftth_users: list[User] = []


async def refresh_partial_refund_database(db: AsyncIOMotorDatabase) -> Result:
    """
    Refresh the partial refund database by recomputing the partial refunds for each active FTTH user

    Returns the list of failed FTTH user without start_date
    """
    result: Result = Result()

    users = [
        User.model_validate(user) for user in await db.users.find({}).to_list(None)
    ]

    ftth_users = [
        user
        for user in users
        if user.membership
        and user.membership.status == MembershipStatus.ACTIVE
        and user.membership.type == MembershipType.FTTH
    ]

    # Get existing partial refund objects for active ftth_users
    partial_refunds = [
        PartialRefund.model_validate(refund)
        for refund in await db.partial_refunds.find(
            {"user_id": {"$in": [str(user.id) for user in ftth_users]}}
        ).to_list(None)
    ]

    for ftth_user in ftth_users:
        if not ftth_user.membership or not ftth_user.membership.start_date:
            logging.warning(
                "User %s has no start_date, cannot create partial refund objects",
                ftth_user.id,
            )
            result.failed_ftth_users.append(ftth_user)
            continue

        current_compute_month = 0

        # We always try to recompute every month until the current month
        # If we hit an existing partial refund object :
        # - If it is paid, we skip it (Do not recompute it)
        # - If it is not paid AND it's not out of date (same number of wifi adherents), we skip it (Do not recompute it)
        # - If it is not paid AND it's out of date (different number of wifi adherents), we delete it and recompute it
        while increased_by_months(
            ftth_user.membership.start_date, current_compute_month + 1
        ) < datetime.now(tz=pytz.timezone("Europe/Paris")):
            month_start = increased_by_months(
                ftth_user.membership.start_date, current_compute_month
            )
            month_end = increased_by_one_month(month_start)

            # Count the number of eligible wifi adherents during this month
            wifi_adherents: list[AttachedWifiAdherent] = []
            for attached_adh in ftth_user.membership.attached_wifi_adherents:
                if attached_adh.from_date < month_start and (
                    attached_adh.to_date is None or attached_adh.to_date > month_end
                ):
                    wifi_adherents.append(attached_adh)

            # Check if a partial refund object already exists for this month
            existing_partial_refund = next(
                (
                    refund
                    for refund in partial_refunds
                    if refund.user_id == ftth_user.id
                    and refund.month == current_compute_month
                ),
                None,
            )

            # Exists and already treated by Rezel Staff -> no recomputation
            if existing_partial_refund and existing_partial_refund.paid:
                current_compute_month += 1
                continue

            # Exists but not treated by Rezel Staff, and it had already
            # the correct number of wifi adherents -> no recomputation
            elif (
                existing_partial_refund
                and not existing_partial_refund.paid
                and len(wifi_adherents) == len(existing_partial_refund.wifi_adherents)
            ):
                current_compute_month += 1
                continue

            # Exists but not treated by Rezel Staff, and it had not
            # the correct number of wifi adherents -> delete it
            # and recompute it
            elif (
                existing_partial_refund
                and not existing_partial_refund.paid
                and len(wifi_adherents) != len(existing_partial_refund.wifi_adherents)
            ):
                await db.partial_refunds.delete_one(
                    {"_id": str(existing_partial_refund.id)}
                )

            attached_wifi_adherents_users = [
                user
                for user in users
                if user.id in map(lambda x: x.user_id, wifi_adherents)
            ]

            # Create a new partial refund object
            partial_refund = PartialRefund(
                id=uuid4(),
                membership_start=ftth_user.membership.start_date,
                user_id=ftth_user.id,
                month=current_compute_month,
                comment="",
                wifi_adherents=list(map(lambda x: x.user_id, wifi_adherents)),
                paid=False,
                refunded_amount=min(len(wifi_adherents) * 2, 10),
            )
            await db.partial_refunds.insert_one(
                {
                    "_id": str(partial_refund.id),
                    **partial_refund.model_dump(mode="json", exclude={"id"}),
                }
            )
            partial_refunds.append(partial_refund)
            current_compute_month += 1

    return result


def increased_by_months(date: datetime, months: int) -> datetime:
    for _ in range(months):
        date = increased_by_one_month(date)
    return date


def increased_by_one_month(date: datetime) -> datetime:
    if date.month == 12:
        return date.replace(year=date.year + 1, month=1)
    else:
        while date.day > 28:
            try:
                return date.replace(month=date.month + 1)
            except ValueError:
                date = date.replace(day=date.day - 1)

        return date.replace(month=date.month + 1)
