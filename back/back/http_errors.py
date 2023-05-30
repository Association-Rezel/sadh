"""HTTP Exceptions that can be raised."""

from fastapi import HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND


class Unauthorized(HTTPException):
    """Unauthorized."""

    def __init__(self) -> None:
        """Init default args."""
        super().__init__(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


class NotFound(HTTPException):
    """Unauthorized."""

    def __init__(self) -> None:
        """Init default args."""
        super().__init__(
            status_code=HTTP_404_NOT_FOUND,
            detail="Unable to find the requested resource",
        )
