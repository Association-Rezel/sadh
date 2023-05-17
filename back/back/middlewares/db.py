"""Middlewares to inject db data."""

from collections.abc import Generator

from fastapi import Depends

from back.core.users import get_or_create_from_token
from back.database import Session, SessionLocal
from back.http_errors import Unauthorized
from back.interfaces import Token, User
from back.middlewares.auth import token


@Depends
def db() -> Generator[Session, None, None]:
    """Injectable dependency for getting a database session.

    Example implementation :
    ```python
    @router.get("/db")
    async def _test(_db: Session = db) -> None:
        # do thx with db session
        return
    ```
    """
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()


@Depends
def user(_db: Session = db, _token: Token = token) -> User:
    """Decode JWT and find user in the database or create it.

    Example implementation :
    ```python
    @router.get("/name")
    async def _name(_user: User = user) -> str:
        return _user.name
    ```
    """
    return get_or_create_from_token(_db, _token)


@Depends
def must_be_admin(_user: User = user) -> None:
    """User must be admin.

    Example implementation :
    ```python
    @router.get("/admin_only")
    async def _admin_only(_: None = must_be_admin) -> str:
        return "hello world"
    ```
    """
    if not _user.is_admin:
        raise Unauthorized
