"""Get or edit users."""
from typing import Union
from fastapi import APIRouter, Response, status
from back.core import auth
from back.interfaces import LoginUrl, LoginSuccess, LoginError
from back.env import ENV

router = APIRouter(prefix="/auth", tags=["users"])


@router.get("/login")
def login() -> LoginUrl:
    """This is some docs"""
    return LoginUrl(
        url=auth.auth_login(ENV.login_redirect_url)
    )


@router.get("/check", responses={
    200: {"model": LoginSuccess},
    403: {"model": LoginError},
})
def check(code: str, response: Response):
    """This is some docs"""
    response.status_code = status.HTTP_201_CREATED
    return LoginSuccess(
        jwt=""
    )
