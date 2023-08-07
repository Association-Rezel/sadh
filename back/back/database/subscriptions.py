"""Subscription model."""
from uuid import UUID, uuid4

from sqlalchemy import Column, ForeignKey, String, Uuid

from back.database.main import Base, PydanticType
from back.database.users import User
from back.interfaces.box import Chambre, Status


class DBSubscription(Base):
    """Subscription model."""

    __tablename__ = "subscriptions"

    subscription_id: UUID = Column(Uuid, primary_key=True, index=True, default=uuid4)  # type: ignore[assignment]
    user_id: UUID = Column(Uuid, ForeignKey(User.keycloak_id))  # type: ignore[assignment]
    chambre: Chambre = Column(PydanticType(Chambre), nullable=False)  # type: ignore[assignment]
    status: Status = Column(PydanticType(Status), nullable=False, default=Status.PENDING_VALIDATION)  # type: ignore[assignment]
    unsubscribe_reason: str = Column(String, nullable=True, default="")  # type: ignore[assignment]
