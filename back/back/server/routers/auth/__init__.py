from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from back.mongodb.user_com_models import AuthStatusResponse
from back.server.dependencies import OptionalJWTAdmin, OptionalJWTUser
from back.server.oidc import ADMIN_SESSION_KEY, USER_SESSION_KEY
from back.server.routers.auth.callback import router_callback
from back.server.routers.auth.login import router_login

router_auth = APIRouter(prefix="/auth", tags=["auth"])
router_auth.include_router(router_login)
router_auth.include_router(router_callback)


@router_auth.get("/logout")
async def logout(request: Request, redirect_url: str | None = None):
    """Logs the user out by clearing session keys."""
    request.session.pop(USER_SESSION_KEY, None)
    request.session.pop(ADMIN_SESSION_KEY, None)

    return RedirectResponse(
        url=redirect_url or "/",
        status_code=303,
    )


@router_auth.get("/status/user")
async def user_status(user: OptionalJWTUser) -> AuthStatusResponse:
    """Returns the status of the user session."""
    if user is None:
        return AuthStatusResponse(logged_in=False, user=None)

    return AuthStatusResponse(logged_in=True, user=user)


@router_auth.get("/status/admin")
async def admin_status(admin: OptionalJWTAdmin) -> AuthStatusResponse:
    """Returns the status of the admin session."""
    if admin is None:
        return AuthStatusResponse(logged_in=False, user=None)

    return AuthStatusResponse(logged_in=True, user=admin)
