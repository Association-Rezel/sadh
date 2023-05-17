"""Get or edit users."""

from fastapi import APIRouter, Depends

from back.core.users import get_users
from back.database import Session, get_db
from back.interfaces import User
from back.middlewares.db import must_be_admin, user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def _(db: Session = Depends(get_db), _: None = must_be_admin) -> list[User]:
    """This is some docs."""
    return get_users(db)


@router.get("/me")
async def _me(
    _user: User = user,
) -> User:
    """Get the current user's identity."""
    return _user
