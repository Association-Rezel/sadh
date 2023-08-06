"""Get or edit users."""


from back.core.users import get_users
from back.database import Session
from back.interfaces import User
from back.middlewares import db, must_be_admin, user
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("users")


@router.get("/")
def _(_db: Session = db, _: None = must_be_admin) -> list[User]:
    """This is some docs."""
    return get_users(_db)


@router.get("/me")
async def _me(
    _user: User = user,
) -> User:
    """Get the current user's identity."""
    return _user
