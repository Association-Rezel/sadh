"""Subscription interface."""

from uuid import UUID

from pydantic import BaseModel

from back.database.subscription_flows import DBSubscriptionFlow
from back.database.subscriptions import DBSubscription
from back.interfaces.box import Chambre, Status


class Subscription(BaseModel):
    """A subscription model."""

    subscription_id: UUID
    user_id: UUID
    chambre: Chambre
    status: Status = Status.PENDING_VALIDATION
    unsubscribe_reason: str = ""

    @classmethod
    def from_orm(cls, obj: DBSubscription) -> "Subscription":
        """Create a Subscription json response from a Subscription DB schema."""
        return cls(
            subscription_id=obj.subscription_id,
            user_id=obj.user_id,
            chambre=obj.chambre,
            status=obj.status,
            unsubscribe_reason=obj.unsubscribe_reason,
        )

    class Config:
        orm_mode = True


class SubscriptionFlow(BaseModel):
    """A subscription model."""

    subscription_id: UUID
    erdv_information: str
    erdv_id: str
    present_for_appointment: str
    ref_commande: str
    ref_prestation: str
    ont_lent: bool
    box_lent: bool
    box_information: str
    dolibarr_information: str
    cmd_acces_sent: bool
    cr_mes_sent: bool
    comment: str
    paid_caution: bool
    paid_first_month: bool
    contract_signed: bool

    @classmethod
    def from_orm(cls, obj: DBSubscriptionFlow) -> "SubscriptionFlow":
        """Create a Subscription json response from a Subscription Flow DB schema."""
        return cls(
            subscription_id=obj.subscription_id,
            erdv_information=obj.erdv_information,
            erdv_id=obj.erdv_id,
            present_for_appointment=obj.present_for_appointment,
            ref_commande=obj.ref_commande,
            ref_prestation=obj.ref_prestation,
            ont_lent=obj.ont_lent,
            box_lent=obj.box_lent,
            box_information=obj.box_information,
            dolibarr_information=obj.dolibarr_information,
            cmd_acces_sent=obj.cmd_acces_sent,
            cr_mes_sent=obj.cr_mes_sent,
            comment=obj.comment,
            paid_caution=obj.paid_caution,
            paid_first_month=obj.paid_first_month,
            contract_signed=obj.contract_signed,
        )

    class Config:
        orm_mode = True
