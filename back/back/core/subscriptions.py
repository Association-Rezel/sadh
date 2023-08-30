from sqlalchemy.orm import Session

from back.database.subscription_flows import DBSubscriptionFlow
from back.interfaces.subscriptions import SubscriptionFlow


def get_or_create_subscription_flow(db: Session, subscription_id: str) -> SubscriptionFlow:
    flow = db.query(DBSubscriptionFlow).filter_by(subscription_id=subscription_id).first()
    if not flow:
        return create_subscription_flow(db, subscription_id, DBSubscriptionFlow())
    return SubscriptionFlow.from_orm(flow)


def create_subscription_flow(db: Session, subscription_id: str, data: SubscriptionFlow) -> SubscriptionFlow:
    """Create a subscription flow. This function should not be called if a flow already exists for this subscription."""
    flow = DBSubscriptionFlow(
        subscription_id=subscription_id,
        erdv_information=data.erdv_information,
        erdv_id=data.erdv_id,
        present_for_appointment=data.present_for_appointment,
        ref_commande=data.ref_commande,
        ref_prestation=data.ref_prestation,
        ont_lent=data.ont_lent,
        box_lent=data.box_lent,
        box_information=data.box_information,
        dolibarr_information=data.dolibarr_information,
        cmd_acces_sent=data.cmd_acces_sent,
        cr_mes_sent=data.cr_mes_sent,
        comment=data.comment,
    )
    db.add(flow)
    db.commit()
    return SubscriptionFlow.from_orm(flow)
