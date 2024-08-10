import uuid
from uuid import UUID

from fastapi import Depends, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from back.env import ENV
from back.http_errors import NotFound
from back.middlewares.zitadel import ValidatorError, ZitadelIntrospectTokenValidator, ZitadelUserInfos
from back.mongodb.db import get_db
from back.mongodb.hermes_models import Box
from back.mongodb.user_models import User


@Depends
def introspect_access_token(authorization: str = Header(None)) -> ZitadelUserInfos:
    """
    Request introspection token endpoint with the access token and
    return the token information as a ZitadelUserInfos object.
    """

    if authorization is None:
        raise HTTPException(status_code=401, detail="No Authorization header provided.")
    token = authorization.split("Bearer ")[1]
    validator = ZitadelIntrospectTokenValidator()
    try:
        introspected = validator(token, "openid profile email")

        try:
            is_admin = ENV.zitadel_org_id in introspected["urn:zitadel:iam:org:project:roles"][ENV.zitadel_admin_role]
        except KeyError:
            is_admin = False

        return ZitadelUserInfos(
            given_name=introspected["given_name"],
            family_name=introspected["family_name"],
            email=introspected["email"],
            admin=is_admin,
        )
    except ValidatorError as e:
        raise HTTPException(status_code=e.status_code, detail=e.error)


@Depends
def must_be_sadh_admin(user: ZitadelUserInfos = introspect_access_token) -> None:
    """If the user is not an admin, raise a 403 error."""
    if not user.admin:
        raise HTTPException(status_code=403, detail="User must be admin")


@Depends
async def get_user_me(
    userInfos: ZitadelUserInfos = introspect_access_token,
    db: AsyncIOMotorDatabase = get_db,
) -> User:
    """
    Returns the User object from the database corresponding to the user making the request.
    If the user does not exist, it is created.
    """
    userdict = await db.users.find_one_and_update(
        {"email": userInfos.email},
        {
            "$set": {
                "first_name": userInfos.given_name,
                "last_name": userInfos.family_name,
                "email": userInfos.email,
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
    if not user.membership or not user.membership.unetid:
        return None

    return Box.model_validate(await db.boxes.find_one({"unets.unet_id": user.membership.unetid}))
