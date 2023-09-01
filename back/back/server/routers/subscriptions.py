"""Manage subscriptions."""

from fastapi import HTTPException

from back.core.subscriptions import create_subscription_flow, get_or_create_subscription_flow
from back.core.users import get_subscriptions
from back.database import Session
from back.database.subscription_flows import DBSubscriptionFlow
from back.database.subscriptions import DBSubscription
from back.interfaces.subscriptions import Subscription, SubscriptionFlow
from back.middlewares import db, must_be_admin
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("subscriptions")


@router.get("/")
def _get_subscriptions(_db: Session = db, _: None = must_be_admin) -> list[Subscription]:
    """Get all subscriptions."""
    return get_subscriptions(_db)


@router.put("/{subscription_id}")
async def _user_update_subscription(
    subscription_id: str,
    subscription: Subscription,
    _db: Session = db,
    _: None = must_be_admin,
) -> Subscription:
    sub = _db.query(DBSubscription).filter_by(subscription_id=subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.chambre = subscription.chambre
    sub.status = subscription.status
    sub.unsubscribe_reason = subscription.unsubscribe_reason
    _db.commit()
    return Subscription.from_orm(sub)


@router.get("/{sub_id}/subscription_flow")
async def _get_subscription_flow(
    sub_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> SubscriptionFlow:
    return get_or_create_subscription_flow(_db, sub_id)


@router.post("/{sub_id}/subscription_flow")
async def _create_subscription_flow(
    sub_id: str,
    data: SubscriptionFlow,
    _db: Session = db,
    _: None = must_be_admin,
) -> SubscriptionFlow:
    if _db.query(DBSubscriptionFlow).filter_by(subscription_id=sub_id).first():
        raise HTTPException(status_code=409, detail="Flow already exists for this subscription")
    return create_subscription_flow(_db, sub_id, data)


@router.put("/{sub_id}/subscription_flow")
async def _update_subscription_flow(
    sub_id: str,
    data: SubscriptionFlow,
    _db: Session = db,
    _: None = must_be_admin,
) -> SubscriptionFlow:
    flow = _db.query(DBSubscriptionFlow).filter_by(subscription_id=sub_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow does not exist for this subscription")
    flow.erdv_information = data.erdv_information
    flow.erdv_id = data.erdv_id
    flow.present_for_appointment = data.present_for_appointment
    flow.ref_commande = data.ref_commande
    flow.ref_prestation = data.ref_prestation
    flow.ont_lent = data.ont_lent
    flow.box_lent = data.box_lent
    flow.box_information = data.box_information
    flow.dolibarr_information = data.dolibarr_information
    flow.cmd_acces_sent = data.cmd_acces_sent
    flow.cr_mes_sent = data.cr_mes_sent
    flow.comment = data.comment
    _db.commit()
    return SubscriptionFlow.from_orm(flow)
