import urllib.parse
from typing import Literal

from fastapi import APIRouter, Request

from back.env import ENV
from back.server.oidc import oauth

router_login = APIRouter(prefix="/login")


@router_login.get("/user")
async def login_user(
    request: Request,
    success_uri: str | None = None,
    prompt: Literal["create"] | None = None,
):
    """Initiates the OIDC login flow for regular users."""
    provider_name = "user_oidc"
    if success_uri:
        success_uri = urllib.parse.urlparse(success_uri).path
    request.session[f"{provider_name}_login_details"] = {
        "success_url": success_uri or "/",
        "error_url": "/login/auth-error",
    }

    kwargs = {}
    if prompt:
        kwargs["prompt"] = prompt

    return await getattr(oauth, provider_name).authorize_redirect(
        request,
        ENV.oidc_redirect_uri,
        **kwargs,
    )


@router_login.get("/admin")
async def login_admin(
    request: Request,
    success_uri: str | None = None,
):
    """Initiates the OIDC login flow for admins."""
    provider_name = "admin_oidc"
    if success_uri:
        success_uri = urllib.parse.urlparse(success_uri).path
    request.session[f"{provider_name}_login_details"] = {
        "success_url": success_uri or "/admin",
        "error_url": "/login/auth-error",
    }
    return await getattr(oauth, provider_name).authorize_redirect(
        request, ENV.oidc_admin_redirect_uri
    )
