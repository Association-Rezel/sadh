"""Get or edit users."""
import logging

from fastapi import APIRouter, Depends

from back.database import Session, get_db
from back.database.users import User as DBUser
from back.interfaces import User
from back.keycloak_client import Token, Unauthorized, protect

router = APIRouter(prefix="/users", tags=["users"])
__logger = logging.getLogger(__name__)


@Depends
def user_from_jwt(db: Session = Depends(get_db), token: Token = protect) -> DBUser:
    """Decode JWT and find user in the database or create it."""
    u = db.get(DBUser, token.sub)
    if not u:
        __logger.info("Creating user %s", token.sub)
        u = DBUser(keycloak_id=token.sub)
        db.add(u)
        db.commit()
    return u


@Depends
def must_be_admin(user: DBUser = user_from_jwt) -> None:
    """User must be admin."""
    if not user.is_admin:
        raise Unauthorized


@router.get("/")
def get_users(db: Session = Depends(get_db), _: None = must_be_admin) -> list[User]:
    """This is some docs."""
    return [User(keycloak_id=u.keycloak_id, is_admin=u.is_admin) for u in db.query(DBUser).all()]


@router.get("/me")
async def get_current_user(
    user: DBUser = user_from_jwt,
) -> User:
    """Get the current user's identity."""
    return User(keycloak_id=user.keycloak_id, is_admin=user.is_admin)
