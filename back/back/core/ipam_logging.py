import uuid
from datetime import timedelta

from common_models.log_models import IpamLog
from motor.motor_asyncio import AsyncIOMotorDatabase

from back.messaging.matrix import send_matrix_message


async def create_log(
    db: AsyncIOMotorDatabase,
    log: IpamLog,
) -> None:

    try:
        await db.ipam_logs.update_one(
            {
                "from_date": {"$lt": log.timestamp.timestamp()},
                "to_date": {"$gt": log.timestamp.timestamp()},
            },
            {
                "$push": {"logs": log.model_dump(mode="json")},
                "$setOnInsert": {
                    "_id": str(uuid.uuid4()),
                    "from_date": log.timestamp.replace(
                        hour=0, minute=0, second=0, microsecond=0
                    ).timestamp(),
                    "to_date": (
                        log.timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
                        + timedelta(days=1)
                    ).timestamp(),
                },
            },
            upsert=True,
        )
    except Exception as e:
        send_matrix_message(
            "Error while creating log",
            f"Message : {log.message}",
            f"Source : {log.source}",
            f"{e}",
            "",
        )
