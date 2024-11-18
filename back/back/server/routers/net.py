from typing import List

import requests
from motor.motor_asyncio import AsyncIOMotorDatabase

from back.env import ENV
from back.mongodb.db import get_db
from back.server.dependencies import must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("net")


@router.get(
    "/ssids",
    response_model=list[str],
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


@router.get(
    "/get-all-ont-summary", response_model=str, dependencies=[must_be_sadh_admin]
)
def get_all_ont_summary():
    """Get all ONT summary from Charon"""

    r = requests.get(
        f"{ENV.charon_url}/get-all-ont-summary/olt1",
        timeout=10,
    )

    if r.status_code != 200:
        return f"Charon Error {r.status_code} : {r.text}"

    return r.text
