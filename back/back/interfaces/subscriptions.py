"""Subscription interface."""

from uuid import UUID

from pydantic import BaseModel

from back.database.subscriptions import DBSubscription
from back.interfaces.box import Chambre, Status


class Subscription(BaseModel):
    """A subscription model."""

    subscription_id: UUID
    user_id: UUID
    chambre: Chambre
    status: Status = Status.PENDING_VALIDATION
    unsubscribe_reason: str = ""

    @classmethod
    def from_orm(cls, obj: DBSubscription) -> "Subscription":
        """Create a Subscription json response from a Subscription DB schema."""
        return cls(
            subscription_id=obj.subscription_id,
            user_id=obj.user_id,
            chambre=obj.chambre,
            status=obj.status,
            unsubscribe_reason=obj.unsubscribe_reason,
        )

    class Config:
        orm_mode = True
