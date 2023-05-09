"""Get or edit users."""
from fastapi import APIRouter, Depends

from back.core import users
from back.database import Session, get_db
from back.interfaces import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def get_users(db: Session = Depends(get_db)) -> list[User]:
    """This is some docs."""
    return users.get_users(db)
