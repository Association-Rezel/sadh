"""Some models."""
import uuid

from pydantic import BaseModel

from back.database.models import User as DBUser


class User(BaseModel):
    """A user model."""

    keycloak_id: uuid.UUID
    is_admin: bool
    name: str

    @classmethod
    def from_orm(cls, obj: DBUser) -> "User":
        """Create a User json response from a User DB schema."""
        return cls(
            keycloak_id=obj.keycloak_id,
            is_admin=obj.is_admin,
            name=obj.name,
        )


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
