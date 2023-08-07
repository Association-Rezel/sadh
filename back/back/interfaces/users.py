"""User interface."""

from pydantic import BaseModel

from back.database.users import User as DBUser
from back.interfaces.auth import KeycloakId


class User(BaseModel):
    """A user model."""

    keycloak_id: KeycloakId
    is_admin: bool
    name: str

    @classmethod
    def from_orm(cls, obj: DBUser) -> "User":
        """Create a User json response from a User DB schema."""
        return cls(
            keycloak_id=KeycloakId(obj.keycloak_id),
            is_admin=obj.is_admin,
            name=obj.name,
        )
