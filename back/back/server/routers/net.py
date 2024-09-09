from typing import List

from motor.motor_asyncio import AsyncIOMotorDatabase

from back.mongodb.db import get_db
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("net")


@router.get(
    "/ssids",
    response_model=List[str],
)
async def _list_ssids(
    db: AsyncIOMotorDatabase = get_db,
):
    """List all SSIDS."""

    return (
        await db.boxes.aggregate(
            [
                {"$unwind": "$unets"},
                {"$group": {"_id": None, "ssids": {"$addToSet": "$unets.wifi.ssid"}}},
                {"$project": {"_id": 0, "ssids": 1}},
            ]
        ).to_list(None)
    )[0]["ssids"]
