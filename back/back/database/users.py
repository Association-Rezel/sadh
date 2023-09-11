"""User model."""
from uuid import UUID

from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.database.main import Base
from back.database.typing import MappedOptionalSub


class DBUser(Base):
    """User model."""

    __tablename__ = "users"

    keycloak_id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, index=True)  # type: ignore[assignment]

    name: Mapped[str] = mapped_column(String)  # type: ignore[assignment]
    email: Mapped[str] = mapped_column(String)  # type: ignore[assignment]
    phone: Mapped[str] = mapped_column(String)  # type: ignore[assignment]

    is_active: Mapped[str] = mapped_column(Boolean, default=True)  # type: ignore[assignment]
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]

    subscription: MappedOptionalSub = relationship("DBSubscription", back_populates="user")
