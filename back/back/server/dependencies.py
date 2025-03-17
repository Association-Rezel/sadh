import uuid

from common_models.hermes_models import Box
from common_models.user_models import User
from fastapi import Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from netaddr import EUI, mac_unix_expanded
from pymongo import ReturnDocument

from back.core.hermes import get_box_from_user
from back.core.status_update import StatusUpdateManager
from back.core.oidc import (
    ValidatorError,
    OIDCTokenValidator,
    OIDCUserInfo,
)
from back.env import ENV
from back.mongodb.db import get_db

token_validator = OIDCTokenValidator()


@Depends
def introspect_access_token(authorization: str = Header(None)) -> OIDCUserInfo:
    """
    Récupère le token d'accès, le valide via OIDC et retourne un objet `OIDCUserInfo`.
    """

    if authorization is None:
        raise HTTPException(status_code=401, detail="No Authorization header provided.")
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Invalid Authorization header format."
        )

    token = authorization.split("Bearer ")[1]
    try:
        introspected = token_validator(token)

        try:
            is_admin = ENV.oidc_admin_entitlement in introspected.get(
                "entitlements", []
            )
        except KeyError:
            is_admin = False

        return OIDCUserInfo(
            given_name=introspected["given_name"],
            family_name=introspected["family_name"],
            email=introspected["email"],
            admin=is_admin,
        )
    except ValidatorError as e:
        raise HTTPException(status_code=e.status_code, detail=e.error) from e


@Depends
def must_be_sadh_admin(user: OIDCUserInfo = introspect_access_token) -> None:
    """If the user is not an admin, raise a 403 error"""
    if not user.admin:
        raise HTTPException(status_code=403, detail="User must be admin")


@Depends
async def get_user_me(
    userInfo: OIDCUserInfo = introspect_access_token,
    db: AsyncIOMotorDatabase = get_db,
) -> User:
    """
    Returns the User object from the database corresponding to the user making the request.
    If the user does not exist, it is created.
    """
    userdict = await db.users.find_one_and_update(
        {"email": userInfo.email},
        {
            "$set": {
                "first_name": userInfo.given_name,
                "last_name": userInfo.family_name,
                "email": userInfo.email,
            },
            "$setOnInsert": {
                "_id": str(uuid.uuid4()),
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    user = User.model_validate(userdict)

    return user


@Depends
async def get_user_from_user_id(
    user_id: str,
    db: AsyncIOMotorDatabase = get_db,
) -> User:
    """Can be used on routes with a user_id parameter to get the user object from the database."""
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate(user)


@Depends
async def get_box_from_user_id(
    user: User = get_user_from_user_id,
    db: AsyncIOMotorDatabase = get_db,
) -> Box | None:
    """Can be used on routes with a user_id parameter to get the box from the database."""
    return await get_box(db, user)


@Depends
async def get_my_box(
    user: User = get_user_me,
    db: AsyncIOMotorDatabase = get_db,
) -> Box | None:
    """Can be used on user routes to get their own box from the database."""
    return await get_box(db, user)


async def get_box(
    db: AsyncIOMotorDatabase,
    user: User,
) -> Box | None:
    """Return the user box."""
    return await get_box_from_user(db, user)


@Depends
async def parse_mac_str(mac_str: str) -> EUI:
    try:
        return EUI(mac_str, dialect=mac_unix_expanded)
    except Exception as ex:
        raise HTTPException(status_code=400, detail="Invalid MAC address") from ex


@Depends
async def get_box_from_mac_str(
    mac: EUI = parse_mac_str,
    db: AsyncIOMotorDatabase = get_db,
) -> Box:
    """Return the box with the given MAC address."""
    box_dict = await db.boxes.find_one({"mac": str(mac)})

    if box_dict is None:
        raise HTTPException(status_code=404, detail="Box not found")

    return Box.model_validate(box_dict)


status_update_manager = StatusUpdateManager()


@Depends
async def get_status_update_manager() -> StatusUpdateManager:
    return status_update_manager
