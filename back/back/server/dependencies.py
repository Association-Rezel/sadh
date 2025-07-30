import logging
import time
from typing import Annotated, Literal

from common_models.hermes_models import Box
from common_models.user_models import User
from fastapi import Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from netaddr import EUI, mac_unix_expanded

from back.core.hermes import get_box_from_user
from back.core.status_update import StatusUpdateManager
from back.env import ENV
from back.mongodb.db import GetDatabase
from back.server.oidc import ADMIN_SESSION_KEY, JWT, USER_SESSION_KEY, JWTAdmin, JWTUser


async def _get_current_jwt(
    request: Request, session_key: Literal["user", "admin"], provider_name: str
) -> JWTUser | JWTAdmin:
    """
    Dependency to retrieve and validate user data from the session.
    Performs application-level session age check using 'iat'.
    """
    session_data = request.session.get(session_key)
    if not session_data:
        raise HTTPException(
            status_code=401,
            detail=f"Not authenticated ({provider_name}). Please log in.",
        )

    try:
        jwt = JWT.model_validate(session_data)
        now = time.time()
        if (now - jwt.iat) > ENV.session_expiration_time_seconds:
            # Clear the potentially stale session data
            request.session.pop(session_key, None)
            logging.debug(
                "Session expired for %s",
                provider_name,
                extra={"session_data": session_data},
            )
            raise HTTPException(
                status_code=401,
                detail=f"Session expired ({provider_name}). Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Refresh the session expiration time
        request.session[session_key] = {
            **session_data,
            "iat": int(now),
        }

        if session_key == USER_SESSION_KEY:
            return JWTUser.model_validate(session_data)
        elif session_key == ADMIN_SESSION_KEY:
            return JWTAdmin.model_validate(session_data)
        else:
            raise ValueError(f"Unknown session key: {session_key}")

    except (
        ValueError,
        TypeError,
    ) as e:
        request.session.pop(session_key, None)
        logging.warning(
            "Error validating session data for provider type %s: %s",
            provider_name,
            e,
            extra={"session_data": session_data},
        )
        raise HTTPException(
            status_code=401,
            detail=f"Invalid session data ({provider_name}). Please log in again.",
        ) from e


async def _get_jwt_user_or_raise(request: Request) -> JWTUser:
    """Dependency for routes requiring regular user authentication."""
    jwt = await _get_current_jwt(request, USER_SESSION_KEY, "user")
    assert isinstance(jwt, JWTUser), "Expected JWTUser type"
    return jwt


async def _get_jwt_admin_or_raise(request: Request) -> JWTAdmin:
    """Dependency for routes requiring admin authentication."""
    jwt = await _get_current_jwt(request, ADMIN_SESSION_KEY, "admin")
    assert isinstance(jwt, JWTAdmin), "Expected JWTAdmin type"
    return jwt


RequireJWTUser = Annotated[
    JWTUser,
    Depends(_get_jwt_user_or_raise),
]
RequireJWTAdmin = Annotated[
    JWTAdmin,
    Depends(_get_jwt_admin_or_raise),
]


async def must_be_admin(
    _: RequireJWTAdmin,
) -> None:
    pass


async def _get_jwt_admin_or_none(request: Request) -> JWTAdmin | None:
    try:
        return await _get_jwt_admin_or_raise(request)
    except HTTPException as exception:
        if exception.status_code != 401 and exception.status_code != 403:
            raise
    return None


async def _get_jwt_user_or_none(request: Request) -> JWTUser | None:
    try:
        return await _get_jwt_user_or_raise(request)
    except HTTPException as exception:
        if exception.status_code != 401 and exception.status_code != 403:
            raise
    return None


OptionalJWTUser = Annotated[
    JWTUser | None,
    Depends(_get_jwt_user_or_none),
]
OptionalJWTAdmin = Annotated[
    JWTAdmin | None,
    Depends(_get_jwt_admin_or_none),
]


async def _get_user_me_or_raise(
    db: GetDatabase,
    jwt_user: RequireJWTUser,
) -> User:
    """Get the current user."""
    return User.model_validate(await db.users.find_one({"_id": str(jwt_user.user_id)}))


async def _get_user_me_or_none(
    db: GetDatabase,
    jwt_user: OptionalJWTUser,
) -> User | None:
    """Get the current user."""
    if jwt_user is None:
        return None
    return User.model_validate(await db.users.find_one({"_id": str(jwt_user.user_id)}))


RequireCurrentUser = Annotated[
    User,
    Depends(_get_user_me_or_raise),
]

OptionalCurrentUser = Annotated[
    User | None,
    Depends(_get_user_me_or_none),
]


async def _get_user_from_user_id_or_raise(
    user_id: str,
    db: GetDatabase,
) -> User:
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate(user)


UserFromPath = Annotated[
    User,
    Depends(_get_user_from_user_id_or_raise),
]


async def get_box_from_user_id_or_none(
    user: UserFromPath,
    db: GetDatabase,
) -> Box | None:
    """Can be used on routes with a user_id parameter to get the box from the database."""
    return await get_box(db, user)


BoxFromUserInPath = Annotated[
    Box | None,
    Depends(get_box_from_user_id_or_none),
]


async def _get_my_box(
    user: RequireCurrentUser,
    db: GetDatabase,
) -> Box | None:
    """Can be used on user routes to get their own box from the database."""
    return await get_box(db, user)


OptionalCurrentUserBox = Annotated[
    Box | None,
    Depends(_get_my_box),
]


async def get_box(
    db: AsyncIOMotorDatabase,
    user: User,
) -> Box | None:
    """Return the user box."""
    return await get_box_from_user(db, user)


async def parse_mac_str(mac_str: str) -> EUI:
    try:
        return EUI(mac_str, dialect=mac_unix_expanded)
    except Exception as ex:
        raise HTTPException(status_code=400, detail="Invalid MAC address") from ex


ParseMacAddressInPath = Annotated[
    EUI,
    Depends(parse_mac_str),
]


async def get_box_from_mac_str(
    mac: ParseMacAddressInPath,
    db: GetDatabase,
) -> Box:
    """Return the box with the given MAC address."""
    box_dict = await db.boxes.find_one({"mac": str(mac)})

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)


BoxFromMacStr = Annotated[
    Box,
    Depends(get_box_from_mac_str),
]


status_update_manager = StatusUpdateManager()


async def get_status_update_manager() -> StatusUpdateManager:
    return status_update_manager


StatusUpdateManagerDep = Annotated[
    StatusUpdateManager,
    Depends(get_status_update_manager),
]
