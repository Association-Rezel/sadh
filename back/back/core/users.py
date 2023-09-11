"""User CRUDs."""
import itertools
import logging
from typing import Generator

from sqlalchemy import select
from sqlalchemy.orm import Session

from back.database.appointments import DBAppointment
from back.database.subscription_flows import DBSubscriptionFlow
from back.database.subscriptions import DBSubscription
from back.database.users import DBUser
from back.interfaces.appointments import Appointment
from back.interfaces.auth import KeycloakId, Token
from back.interfaces.subscriptions import Subscription, SubscriptionFlow
from back.interfaces.users import User, UserDataBundle
from back.netbox_client import NETBOX

__logger = logging.getLogger(__name__)


def get_users(db: Session) -> list[User]:
    """Get all users."""
    return list(
        map(
            User.from_orm,
            db.query(DBUser).all(),
        ),
    )


def get_subscriptions(db: Session) -> list[Subscription]:
    """Get all subscriptions."""
    return list(
        map(
            Subscription.from_orm,
            db.query(DBSubscription).all(),
        ),
    )


def get_or_create_from_token(db: Session, token: Token) -> User:
    """Decode JWT and find user in the database or create it."""
    u = db.get(DBUser, token.keycloak_id)
    if not u:
        __logger.info("Creating user %s", token.name)
        u = DBUser(keycloak_id=token.keycloak_id, name=token.name, email=token.email, phone=token.phone)
        db.add(u)
        db.commit()
        NETBOX.create_user_tag(u)
    return User.from_orm(u)


def get_user_bundles(db: Session, keycloak_id: KeycloakId | None = None) -> list[UserDataBundle]:
    """Get all users."""
    statement = (
        select(DBUser, DBSubscription, DBSubscriptionFlow, DBAppointment)
        .outerjoin(DBSubscription, DBSubscription.user_id == DBUser.keycloak_id)
        .outerjoin(
            DBSubscriptionFlow,
            DBSubscription.subscription_id == DBSubscriptionFlow.subscription_id,
        )
        .outerjoin(DBAppointment, DBAppointment.subscription_id == DBSubscription.subscription_id)
    )

    if keycloak_id:
        statement = statement.where(DBUser.keycloak_id == keycloak_id)

    rows = db.execute(statement).all()

    # Group by appointment
    rows_grouped = list(_group_by_appoinment(list(map(lambda row: row.tuple(), rows))))

    return list(
        map(
            lambda row: UserDataBundle(
                user=User.from_orm(row[0]),
                subscription=Subscription.from_orm(row[1]) if row[1] else None,
                flow=SubscriptionFlow.from_orm(row[2]) if row[2] else None,
                appointments=list(map(Appointment.from_orm, row[3])),
            ),
            rows_grouped,
        )
    )


def _group_by_appoinment(
    rows: list[tuple[DBUser, DBSubscription, DBSubscriptionFlow, DBAppointment]]
) -> Generator[tuple[DBUser, DBSubscription, DBSubscriptionFlow, list[DBAppointment]], None, None]:
    it = itertools.groupby(rows, lambda row: row[0].keycloak_id)
    for keycloak_id, grouped_rows_it in it:
        new_tuple: tuple[DBUser, DBSubscription, DBSubscriptionFlow, list[DBAppointment]] | None = None
        for grouped_row in grouped_rows_it:
            if not new_tuple:  # first iteration
                if grouped_row[3]:
                    new_tuple = (*grouped_row[:3], [grouped_row[3]])
                else:
                    new_tuple = (*grouped_row[:3], [])
            else:
                new_tuple[3].append(grouped_row[3])

        yield new_tuple  # type: ignore # Since new_tuple is never None after the first iteration
