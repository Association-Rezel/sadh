from common_models.partial_refund import PartialRefund
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.partial_refunds import refresh_partial_refund_database
from back.mongodb.db import get_db
from back.server.dependencies import must_be_sadh_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("partial-refunds")


@router.post(
    "/compute",
    dependencies=[must_be_sadh_admin],
)
async def _generate_all_refunds(
    db: AsyncIOMotorDatabase = get_db,
) -> JSONResponse:
    failed_users = (await refresh_partial_refund_database(db)).failed_ftth_users
    message = ""
    if failed_users:
        message = "These users have no membership start date. Cannot compute partial refunds for them\n- "
        message += "\n- ".join(
            [f"{user.first_name} {user.last_name}" for user in failed_users]
        )

    return JSONResponse({"message": message})


@router.get(
    "/",
    response_model=list[PartialRefund],
    dependencies=[must_be_sadh_admin],
)
async def _get_refunds(
    db: AsyncIOMotorDatabase = get_db,
) -> list[PartialRefund]:
    return [
        PartialRefund.model_validate(refund)
        for refund in await db.partial_refunds.find({}).to_list(None)
    ]


@router.patch(
    "/",
    response_model=PartialRefund,
    dependencies=[must_be_sadh_admin],
)
async def _update_refund(
    refund: PartialRefund,
    db: AsyncIOMotorDatabase = get_db,
) -> PartialRefund:
    return PartialRefund.model_validate(
        await db.partial_refunds.find_one_and_update(
            {"_id": str(refund.id)},
            {"$set": refund.model_dump(mode="json", exclude={"id"})},
            return_document=ReturnDocument.AFTER,
        )
    )


@router.delete(
    "/{refund_id}",
    dependencies=[must_be_sadh_admin],
)
async def _delete_refund(
    refund_id: str,
    db: AsyncIOMotorDatabase = get_db,
) -> JSONResponse:
    await db.partial_refunds.delete_one({"_id": refund_id})
    return JSONResponse({"message": "Refund deleted"})
