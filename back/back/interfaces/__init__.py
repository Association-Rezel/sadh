"""Some models."""
import uuid

from pydantic import BaseModel


class User(BaseModel):
    """A user model."""

    keycloak_id: uuid.UUID
    is_admin: bool


class LoginUrl(BaseModel):
    """A request to log to the keycloak server."""

    url: str

    class Config:
        """Config."""

        schema_extra = {"example": {"url": "https://example.com/login"}}


class LoginSuccess(BaseModel):
    """A request to log to the keycloak server."""

    success: bool = True
    jwt: str


class LoginError(BaseModel):
    """A request to log to the keycloak server."""

    success: bool = False
