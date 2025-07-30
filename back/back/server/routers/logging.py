from datetime import datetime

from common_models.log_models import IpamLog, IpamLogBucket
from fastapi import APIRouter, Depends

from back.core.ipam_logging import create_log
from back.mongodb.db import GetDatabase
from back.server.dependencies import RequireJWTAdmin, must_be_admin

router = APIRouter(prefix="/logging", tags=["logging"])


@router.get(
    "/ipam",
    response_model=list[IpamLog],
    dependencies=[Depends(must_be_admin)],
)
async def _get_ipam_logs(
    start: int,
    end: int,
    db: GetDatabase,
) -> list[IpamLog]:

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
    dependencies=[Depends(must_be_admin)],
)
async def _create_ipam_log(
    message: str,
    source: str,
    db: GetDatabase,
    admin: RequireJWTAdmin,
) -> None:
    """Create IPAM log."""

    await create_log(
        db,
        IpamLog(
            timestamp=datetime.now(),
            source=source + " (via sadh-back - " + admin.email + ")",
            message=message,
        ),
    )
