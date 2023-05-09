"""User CRUDs."""
from sqlalchemy.orm import Session

from back.database import models
from back.interfaces import User


def get_users(db: Session) -> list[User]:
    """Get all users."""
    users = db.query(models.User).all()
    return [User(keycloak_id=user.keycloak_id) for user in users]
