"""Get or edit users."""
import logging

from fastapi import APIRouter, Depends

from back.core.users import get_or_create_from_token, get_users
from back.database import Session, get_db
from back.database.users import User as DBUser
from back.interfaces import User
from back.keycloak_client import Token, Unauthorized, protect

router = APIRouter(prefix="/users", tags=["users"])
__logger = logging.getLogger(__name__)


@Depends
def user_from_jwt(db: Session = Depends(get_db), token: Token = protect) -> User:
    """Decode JWT and find user in the database or create it."""
    return get_or_create_from_token(db, token)


@Depends
def must_be_admin(user: DBUser = user_from_jwt) -> None:
    """User must be admin."""
    if not user.is_admin:
        raise Unauthorized


@router.get("/")
def _(db: Session = Depends(get_db), _: None = must_be_admin) -> list[User]:
    """This is some docs."""
    return get_users(db)


@router.get("/me")
async def _me(
    user: User = user_from_jwt,
) -> User:
    """Get the current user's identity."""
    return user
