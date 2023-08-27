"""User CRUDs."""
import logging

from sqlalchemy.orm import Session

from back.database import models
from back.interfaces import Token, User
from back.netbox_client import NETBOX

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
    u = db.get(models.User, token.keycloak_id)
    if not u:
        __logger.info("Creating user %s", token.name)
        u = models.User(keycloak_id=token.keycloak_id, name=token.name, email=token.email)
        db.add(u)
        db.commit()
        NETBOX.create_user_tag(u)
    return User.from_orm(u)
