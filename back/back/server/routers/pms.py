from typing import List

from motor.motor_asyncio import AsyncIOMotorDatabase

from back.middlewares.dependencies import must_be_sadh_admin
from back.mongodb.db import get_db
from back.mongodb.pon_models import PM, PMInfo
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("pms")


@router.get(
    "/",
    response_model=List[PMInfo],
    dependencies=[must_be_sadh_admin],
)
async def _list_pms(
    db: AsyncIOMotorDatabase = get_db,
):
    """List all PMs."""
    pm_list = await db.pms.find().to_list(None)

    pm_info_list = [PMInfo.model_validate(pm) for pm in pm_list]

    return pm_info_list
