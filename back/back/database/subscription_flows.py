"""User model."""
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from back.database.main import Base
from back.database.typing import MappedSub


class DBSubscriptionFlow(Base):
    """User model."""

    __tablename__ = "subscription_flows"

    flow_id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, index=True, default=uuid4)  # type: ignore[assignment]

    subscription_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("subscriptions.subscription_id"))  # type: ignore[assignment]
    erdv_information: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    erdv_id: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    present_for_appointment: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    ref_commande: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    ref_prestation: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    ont_lent: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    box_lent: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    box_information: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    dolibarr_information: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    cmd_acces_sent: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    cr_mes_sent: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    comment: Mapped[str] = mapped_column(String, default="")  # type: ignore[assignment]
    paid_caution: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    paid_first_month: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]
    contract_signed: Mapped[bool] = mapped_column(Boolean, default=False)  # type: ignore[assignment]

    subscription: MappedSub = relationship("DBSubscription", back_populates="flow")
