"""User CRUDs."""
import logging

from sqlalchemy.orm import Session

from back.database import models
from back.interfaces import User
from back.keycloak_client import Token

__logger = logging.getLogger(__name__)


def get_users(db: Session) -> list[User]:
    """Get all users."""
    return list(
        map(
            User.from_orm,
            db.query(models.User).all(),
        ),
    )


def get_or_create_from_token(db: Session, token: Token) -> User:
    """Decode JWT and find user in the database or create it."""
    u = db.get(models.User, token.sub)
    if not u:
        __logger.info("Creating user %s", token.preferred_username)
        u = models.User(keycloak_id=token.sub, name=token.preferred_username)
        db.add(u)
        db.commit()
    return User.from_orm(u)
