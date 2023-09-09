"""Subscription model."""
from datetime import datetime
from enum import Enum, auto
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from back.database.main import Base, PydanticType
from back.database.subscriptions import DBSubscription


class AppointmentStatus(int, Enum):
    PENDING_VALIDATION = auto()
    VALIDATED = auto()


class AppointmentType(Enum):
    RACCORDEMENT = auto()


class DBAppointment(Base):
    """Appointment model."""

    __tablename__ = "appointments"

    appointment_id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, index=True, default=uuid4)  # type: ignore[assignment]
    subscription_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey(DBSubscription.subscription_id))  # type: ignore[assignment]
    slot_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # type: ignore[assignment]
    slot_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # type: ignore[assignment]
    status: Mapped[AppointmentStatus] = mapped_column(PydanticType(AppointmentStatus), nullable=False, default=AppointmentStatus.PENDING_VALIDATION)  # type: ignore[assignment]
    type: Mapped[AppointmentType] = mapped_column(PydanticType(AppointmentType), nullable=False, default=AppointmentType.RACCORDEMENT)  # type: ignore[assignment]
