"""User model."""
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Column, ForeignKey, String, Uuid

from back.database.main import Base
from back.database.subscriptions import DBSubscription


class DBSubscriptionFlow(Base):
    """User model."""

    __tablename__ = "subscription_flows"

    flow_id: UUID = Column(Uuid, primary_key=True, index=True, default=uuid4)  # type: ignore[assignment]

    subscription_id: UUID = Column(Uuid, ForeignKey(DBSubscription.subscription_id))  # type: ignore[assignment]
    erdv_information: str = Column(String, default="")  # type: ignore[assignment]
    erdv_id: str = Column(String, default="")  # type: ignore[assignment]
    present_for_appointment: str = Column(String, default="")  # type: ignore[assignment]
    ref_commande: str = Column(String, default="")  # type: ignore[assignment]
    ref_prestation: str = Column(String, default="")  # type: ignore[assignment]
    ont_lent: bool = Column(Boolean, default=False)  # type: ignore[assignment]
    box_lent: bool = Column(Boolean, default=False)  # type: ignore[assignment]
    box_information: str = Column(String, default="")  # type: ignore[assignment]
    dolibarr_information: str = Column(String, default="")  # type: ignore[assignment]
    cmd_acces_sent: bool = Column(Boolean, default=False)  # type: ignore[assignment]
    cr_mes_sent: bool = Column(Boolean, default=False)  # type: ignore[assignment]
    comment: str = Column(String, default="")  # type: ignore[assignment]
    paid_caution: bool = Column(Boolean, default="")  # type: ignore[assignment]
    paid_first_month: bool = Column(Boolean, default="")  # type: ignore[assignment]
    contract_signed: bool = Column(Boolean, default="")  # type: ignore[assignment]
