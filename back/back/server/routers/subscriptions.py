"""Gestion des souscriptions."""


from fastapi import HTTPException

from back.database import Session
from back.database.subscriptions import DBSubscription
from back.interfaces.box import Chambre, Status
from back.interfaces.subscriptions import Subscription
from back.interfaces.users import User
from back.middlewares.db import db, user
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("subscriptions")


@router.get("/", status_code=201)
async def _get_user_subscriptions(
    _user: User = user,
    _db: Session = db,
):
    """Get subscription of the current user."""
    sub = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not sub:
        return HTTPException(status_code=404, detail="User has no subscription")
    return Subscription.from_orm(sub)

@router.post("/", status_code=201)
async def _subscribe(
    chambre: Chambre,
    _user: User = user,
    _db: Session = db,
):
    """Ask to subscribe."""
    if _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first():
        return HTTPException(status_code=400, detail="User already subscribed")
    # Create subscription
    subscription = DBSubscription(
        user_id=_user.keycloak_id,
        chambre=chambre,
    )
    _db.add(subscription)
    _db.commit()
    # TODO: Send email to admin
    return Subscription.from_orm(subscription)

@router.put("/", status_code=200)
async def _update_subscription(
    chambre: Chambre,
    _user: User = user,
    _db: Session = db,
):
    """Update subscription."""
    subscription = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not subscription:
        return HTTPException(status_code=404, detail="User did not subscribed")
    if subscription.status != Status.PENDING_VALIDATION:
        return HTTPException(status_code=400, detail="Can't modify not pending subscription")
    subscription.chambre = chambre
    _db.commit()
    return Subscription.from_orm(subscription)

@router.delete("/", status_code=200)
async def _unsubscribe(
    unsubscribe_reason: str,
    _user: User = user,
    _db: Session = db,
):
    """Unsubscribe."""
    subscription = _db.query(DBSubscription).filter_by(user_id=_user.keycloak_id).first()
    if not subscription:
        return HTTPException(status_code=404, detail="User has no subscription")
    if unsubscribe_reason is None:
        return HTTPException(status_code=400, detail="Missing unsubscribe reason")
    subscription.unsubscribe_reason = unsubscribe_reason
    subscription.status = Status.PENDING_UNSUBSCRIPTION
    _db.commit()
    # TODO: Send email to admin
    return Subscription.from_orm(subscription)
