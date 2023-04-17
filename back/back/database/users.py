from sqlalchemy import Boolean, Column, Integer

from back.database.main import Base


class User(Base):
    """User model."""

    __tablename__ = "users"

    keycloak_id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=False)
