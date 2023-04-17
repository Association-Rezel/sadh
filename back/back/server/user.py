"""Get or edit users."""
from fastapi import APIRouter, Depends
from back.core import users
from back.interfaces import User
from back.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def get_users(db=Depends(get_db)) -> list[User]:
    """This is some docs"""
    return users.get_users(db)
