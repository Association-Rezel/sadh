from motor.motor_asyncio import AsyncIOMotorDatabase

from back.mongodb.db import get_db
from back.mongodb.pon_com_models import PMInfo
from back.server.dependencies import must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("pms")


@router.get(
    "/",
    response_model=list[PMInfo],
    dependencies=[must_be_sadh_admin],
)
async def _list_pms(
    db: AsyncIOMotorDatabase = get_db,
):
    """List all PMs."""
    pm_list = await db.pms.find().to_list(None)

    pm_info_list = [PMInfo.model_validate(pm) for pm in pm_list]

    return pm_info_list
