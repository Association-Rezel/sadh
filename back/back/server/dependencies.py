import uuid

from fastapi import Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.core.hermes import get_box_from_user
from back.core.status_update import StatusUpdateManager
from back.core.zitadel import (
    ValidatorError,
    ZitadelIntrospectTokenValidator,
    ZitadelUserInfo,
)
from back.env import ENV
from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.mongodb.user_models import User


@Depends
def introspect_access_token(authorization: str = Header(None)) -> ZitadelUserInfo:
    """
    Request introspection token endpoint with the access token and
    return the token information as a ZitadelUserInfo object.
    """

    if authorization is None:
        raise HTTPException(status_code=401, detail="No Authorization header provided.")
    token = authorization.split("Bearer ")[1]
    validator = ZitadelIntrospectTokenValidator()
    try:
        introspected = validator(token, "openid profile email")

        try:
            is_admin = (
                ENV.zitadel_org_id
                in introspected["urn:zitadel:iam:org:project:roles"][
                    ENV.zitadel_admin_role
                ]
            )
        except KeyError:
            is_admin = False

        return ZitadelUserInfo(
            given_name=introspected["given_name"],
            family_name=introspected["family_name"],
            email=introspected["email"],
            admin=is_admin,
        )
    except ValidatorError as e:
        raise HTTPException(status_code=e.status_code, detail=e.error) from e


@Depends
def must_be_sadh_admin(user: ZitadelUserInfo = introspect_access_token) -> None:
    """If the user is not an admin, raise a 403 error."""
    if not user.admin:
        raise HTTPException(status_code=403, detail="User must be admin")


@Depends
async def get_user_me(
    userInfo: ZitadelUserInfo = introspect_access_token,
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


status_update_manager = StatusUpdateManager()


@Depends
async def get_status_update_manager() -> StatusUpdateManager:
    return status_update_manager
