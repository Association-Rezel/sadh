import logging
import uuid
from typing import Literal

from authlib.integrations.starlette_client import OAuthError
from common_models.user_models import User
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from back.env import ENV
from back.mongodb.db import get_database
from back.server.oidc import (
    ADMIN_SESSION_KEY,
    USER_SESSION_KEY,
    JWTAdmin,
    JWTUser,
    oauth,
)


class LoginCallbackError(Exception):
    """Custom exception for login callback errors."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


async def _handle_oidc_callback(
    request: Request,
    provider_name: str,
    session_key: Literal["user", "admin"],
    required_entitlement: str | None = None,
) -> None:

    provider = getattr(oauth, provider_name)
    try:
        token = await provider.authorize_access_token(request)
    except OAuthError as e:
        logging.warning(
            "OAuth Error during token exchange for %s: %s",
            provider_name,
            e.error,
            exc_info=e,
        )

        raise LoginCallbackError(
            f"OAuth Error during token exchange for {provider_name}: {e.error}"
        ) from e
    except Exception as e:
        logging.error(
            "Unexpected error during token exchange for %s", provider_name, exc_info=e
        )

        raise LoginCallbackError(
            f"Unexpected error during token exchange for {provider_name}"
        ) from e

    if not token or "userinfo" not in token:
        logging.warning("Userinfo not present in token for %s", provider_name)
        raise LoginCallbackError(f"Userinfo not present in token for {provider_name}")

    user_info = token.get("userinfo")

    if required_entitlement:
        entitlements = user_info.get("entitlements", [])
        if (
            not isinstance(entitlements, list)
            or required_entitlement not in entitlements
        ):
            logging.warning(
                "User %s lacks required entitlement '%s' for %s (Found: %s)",
                user_info.get("preferred_username"),
                required_entitlement,
                provider_name,
                entitlements,
            )
            raise LoginCallbackError(
                f"User lacks required entitlement '{required_entitlement}' for {provider_name}"
            )

    username = user_info.get("preferred_username") or user_info.get("sub")
    given_name = user_info.get("firstName", "")
    family_name = user_info.get("lastName", "")
    email = user_info.get("email")
    iat = user_info.get("iat")

    missing = [
        f
        for f in ["username", "email", "given_name", "family_name", "iat"]
        if f not in user_info
    ]
    if missing:
        logging.warning(
            "Missing essential claims (%s) in %s ID token",
            ", ".join(missing),
            provider_name,
        )
        raise LoginCallbackError(
            f"Missing essential claims ({', '.join(missing)}) in {provider_name} ID token"
        )

    if session_key == "user":
        user = await _update_user_db(
            given_name=given_name,
            family_name=family_name,
            email=email,
        )
        jwt_user = JWTUser(
            user_id=user.id,
            email=email,
            iat=iat,
        )
        request.session[session_key] = jwt_user.model_dump(mode="json")
    elif session_key == "admin":
        jwt_admin = JWTAdmin(
            username=username,
            email=email,
            iat=iat,
        )
        request.session[session_key] = jwt_admin.model_dump(mode="json")
    else:
        logging.error("Invalid session key: %s", session_key)
        raise LoginCallbackError(f"Invalid session key: {session_key}")


# --- Helper for Callback Route Processing ---
async def _process_oidc_callback_route(
    request: Request,
    provider_name: str,
    session_key: Literal["user", "admin"],
    required_entitlement: str | None = None,
) -> RedirectResponse:
    """
    Processes the OIDC callback, handles common logic, and performs optional post-authentication actions.
    """
    login_details = request.session.get(f"{provider_name}_login_details")
    print(f"Login details for {provider_name}: {login_details}")
    if (
        not login_details
        or "success_url" not in login_details
        or "error_url" not in login_details
    ):
        return RedirectResponse(
            url="/login/auth-error?error_message=Invalid%20login%20session.%20Please%20try%20logging%20in%20again."
        )

    request.session.pop(f"{provider_name}_login_details")

    success_redirect_url = login_details["success_url"]
    error_redirect_url = login_details["error_url"]

    try:
        await _handle_oidc_callback(
            request=request,
            provider_name=provider_name,
            session_key=session_key,
            required_entitlement=required_entitlement,
        )
    except LoginCallbackError as e:
        logging.debug("%s OIDC callback failed: %s", provider_name, e.message)
        return RedirectResponse(
            url=f"{error_redirect_url}?error_message={e.message}",
            status_code=302,
        )

    return RedirectResponse(url=success_redirect_url, status_code=302)


router_callback = APIRouter(prefix="/callback")


async def _update_user_db(email: str, given_name: str, family_name: str) -> User:
    """Updates user information in the database."""
    user = User.model_validate(
        await get_database().users.find_one_and_update(
            {"email": email},
            {
                "$set": {
                    "first_name": given_name,
                    "last_name": family_name,
                    "email": email,
                },
                "$setOnInsert": {
                    "_id": str(uuid.uuid4()),
                },
            },
            upsert=True,
        )
    )
    return user


@router_callback.get("/user")
async def auth_callback_user(request: Request):
    """Handles the OIDC callback for the user flow and redirects."""
    return await _process_oidc_callback_route(
        request=request,
        provider_name="user_oidc",
        session_key=USER_SESSION_KEY,
        required_entitlement=None,
    )


@router_callback.get("/admin")
async def auth_callback_admin(request: Request):
    """Handles the OIDC callback for the admin flow and redirects."""
    return await _process_oidc_callback_route(
        request=request,
        provider_name="admin_oidc",
        session_key=ADMIN_SESSION_KEY,
        required_entitlement=ENV.oidc_admin_required_entitlement,
    )
