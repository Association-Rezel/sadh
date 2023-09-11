"""User interface."""

from pydantic import BaseModel

from back.database.users import DBUser
from back.interfaces.appointments import Appointment
from back.interfaces.auth import KeycloakId
from back.interfaces.subscriptions import Subscription, SubscriptionFlow


class User(BaseModel):
    """A user model."""

    keycloak_id: KeycloakId
    is_admin: bool
    name: str
    email: str
    phone: str

    @classmethod
    def from_orm(cls, obj: DBUser) -> "User":
        """Create a User json response from a User DB schema."""
        return cls(
            keycloak_id=KeycloakId(obj.keycloak_id),
            is_admin=obj.is_admin,
            name=obj.name,
            email=obj.email,
            phone=obj.phone,
        )


class UserDataBundle(BaseModel):
    """A user model."""

    user: User
    appointments: list[Appointment] = []
    subscription: Subscription | None = None
    flow: SubscriptionFlow | None = None
