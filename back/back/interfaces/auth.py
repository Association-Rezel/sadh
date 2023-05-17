"""User interface."""
from uuid import UUID

from pydantic import BaseModel


class Token(BaseModel):
    """A JWT decoded into a usable struct."""

    keycloak_id: UUID
    name: str
