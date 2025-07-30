from fastapi import APIRouter, Depends

from back.mongodb.db import GetDatabase
from back.mongodb.pon_com_models import PMInfo
from back.server.dependencies import must_be_admin

router = APIRouter(prefix="/pms", tags=["pms"])


@router.get(
    "/",
    response_model=list[PMInfo],
    dependencies=[Depends(must_be_admin)],
)
async def _list_pms(
    db: GetDatabase,
):
    """List all PMs."""
    pm_list = await db.pms.find().to_list(None)

    pm_info_list = [PMInfo.model_validate(pm) for pm in pm_list]

    return pm_info_list
