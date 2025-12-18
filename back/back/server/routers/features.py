from fastapi import APIRouter
from back.env import ENV
from back.server.dependencies import RequireCurrentUser

router = APIRouter(prefix="/features", tags=["features"])


@router.get("/phone-number-check", response_model=bool)
async def _me_ovh_enabled(
    user: RequireCurrentUser,
) -> bool:
    return ENV.ovh_enabled
