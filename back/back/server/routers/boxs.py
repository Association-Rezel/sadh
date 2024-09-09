from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.server.dependencies import must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("boxs")


@router.get(
    "/by_ssid/{ssid}",
    response_model=Box,
    dependencies=[must_be_sadh_admin],
)
async def _get_by_ssid(
    ssid: str,
    db: AsyncIOMotorDatabase = get_db,
):
    """List all SSIDS."""

    box_dict = await db.boxes.find_one({"unets.wifi.ssid": ssid})

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)
