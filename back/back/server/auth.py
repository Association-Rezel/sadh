"""Get or edit users."""
from fastapi import APIRouter
from back.core import auth
from back.interfaces import LoginUrl
from back.env import ENV

router = APIRouter(prefix="/auth", tags=["users"])


@router.get("/login")
def login() -> LoginUrl:
    """This is some docs"""
    return LoginUrl(
        url=auth.auth_login(ENV.login_redirect_url)
    )
