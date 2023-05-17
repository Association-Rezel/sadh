"""User interface."""
from uuid import UUID

from pydantic import BaseModel

from back.database.models import User as DBUser


class User(BaseModel):
    """A user model."""

    keycloak_id: UUID
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
