from datetime import datetime
from typing import List

from motor.motor_asyncio import AsyncIOMotorDatabase

from back.core.ipam_logging import create_log
from back.mongodb.db import get_db
from back.mongodb.log_models import IpamLog, IpamLogBucket
from back.mongodb.user_models import User
from back.server.dependencies import get_user_me, must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("logging")


@router.get(
    "/ipam",
    response_model=List[IpamLog],
    dependencies=[must_be_sadh_admin],
)
async def _get_ipam_logs(
    start: int,
    end: int,
    db: AsyncIOMotorDatabase = get_db,
) -> List[IpamLog]:

    if start >= end:
        return []

    buckets = [
        IpamLogBucket.model_validate(usage).logs
        for usage in await db.ipam_logs.find(
            {"from_date": {"$gte": start, "$lte": end}}
        ).to_list(None)
    ]

    return [log for bucket in buckets for log in bucket]


@router.post(
    "/ipam",
    response_model=None,
    dependencies=[must_be_sadh_admin],
)
async def _create_ipam_log(
    message: str,
    source: str,
    db: AsyncIOMotorDatabase = get_db,
    user: User = get_user_me,
) -> None:
    """Create IPAM log."""

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source=source + " (via sadh-back - " + user.email + ")",
            message=message,
        ),
    )
