"""User model."""
from uuid import UUID

from sqlalchemy import Boolean, Column, String, Uuid

from back.database.main import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    keycloak_id: UUID = Column(Uuid, primary_key=True, index=True)  # type: ignore[assignment]

    name: str = Column(String)  # type: ignore[assignment]
    email: str = Column(String)  # type: ignore[assignment]
    phone: str = Column(String)  # type: ignore[assignment]

    is_active: bool = Column(Boolean, default=True)  # type: ignore[assignment]
    is_admin: bool = Column(Boolean, default=False)  # type: ignore[assignment]
