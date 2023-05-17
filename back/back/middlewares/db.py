"""Middlewares to inject db data."""

from fastapi import Depends

from back.core.users import get_or_create_from_token
from back.database import Session, get_db
from back.http_errors import Unauthorized
from back.interfaces import Token, User
from back.middlewares.auth import token

db: Session = Depends(get_db)


@Depends
def user(_db: Session = db, _token: Token = token) -> User:
    """Decode JWT and find user in the database or create it."""
    return get_or_create_from_token(_db, _token)


@Depends
def must_be_admin(_user: User = user) -> None:
    """User must be admin."""
    if not _user.is_admin:
        raise Unauthorized
