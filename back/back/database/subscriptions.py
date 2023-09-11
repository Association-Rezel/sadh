"""Subscription model."""
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.database.main import Base, PydanticType
from back.database.typing import MappedAppointments, MappedFlow, MappedUser
from back.interfaces.box import Chambre, Status


class DBSubscription(Base):
    """Subscription model."""

    __tablename__ = "subscriptions"

    subscription_id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, index=True, default=uuid4)  # type: ignore[assignment]
    user_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("users.keycloak_id"))  # type: ignore[assignment]
    chambre: Mapped[Chambre] = mapped_column(PydanticType(Chambre), nullable=False)  # type: ignore[assignment]
    status: Mapped[Status] = mapped_column(PydanticType(Status), nullable=False, default=Status.PENDING_VALIDATION)  # type: ignore[assignment]
    unsubscribe_reason: Mapped[str] = mapped_column(String, nullable=True, default="")  # type: ignore[assignment]

    user: MappedUser = relationship("DBUser", back_populates="subscription")
    flow: MappedFlow = relationship("DBSubscriptionFlow", back_populates="subscription")
    appointments: MappedAppointments = relationship("DBAppointment", back_populates="subscription")
