"""Get or edit users."""
from fastapi import APIRouter
from back.core import CORE

from back.interfaces import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def get_users() -> list[User]:
    """This is some docs"""
    return CORE.get_users()
