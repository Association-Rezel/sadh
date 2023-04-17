"""Get or edit users."""
from fastapi import APIRouter
from back.core import users

from back.interfaces import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def get_users() -> list[User]:
    """This is some docs"""
    return users.get_users(None)
