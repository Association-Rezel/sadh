from typing import Optional, Self

from common_models.base import PortableDatetime, PortableIBAN, RezelBaseModel
from common_models.user_models import (
    Address,
    Appointment,
    AppointmentSlot,
    AttachedWifiAdherent,
    DepositStatus,
    EquipmentStatus,
    Membership,
    MembershipStatus,
    MembershipType,
    PaymentMethod,
)
from pydantic import Field, model_validator


class MembershipUpdate(RezelBaseModel):
    status: Optional[MembershipStatus] = Field(None)
    address: Optional[Address] = Field(None)
    comment: Optional[str] = Field(None)
    erdv_id: Optional[str] = Field(None)
    ref_commande: Optional[str] = Field(None)
    ref_prestation: Optional[str] = Field(None)
    equipment_status: Optional[EquipmentStatus] = Field(None)
    deposit_status: Optional[DepositStatus] = Field(None)
    cmd_acces_sent: Optional[bool] = Field(None)
    cr_mes_sent: Optional[bool] = Field(None)
    annul_acces_sent: Optional[bool] = Field(None)
    paid_first_month: Optional[bool] = Field(None)
    contract_signed: Optional[bool] = Field(None)
    appointment: Optional[Appointment] = Field(None)
    start_date: Optional[PortableDatetime] = Field(None)
    attached_wifi_adherents: Optional[list[AttachedWifiAdherent]] = Field(None)


class UserUpdate(RezelBaseModel):
    phone_number: Optional[str] = Field(None)
    iban: Optional[PortableIBAN] = Field(None)
    membership: Optional[Membership] = Field(None)
    availability_slots: Optional[set[AppointmentSlot]] = Field(None)


class MembershipRequest(RezelBaseModel):
    type: MembershipType = Field(...)
    ssid: Optional[str] = Field(None)
    phone_number: Optional[str] = Field(None)
    iban: Optional[PortableIBAN] = Field(None)
    address: Address = Field(...)
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: Optional[str] = Field(None)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.type == MembershipType.FTTH:

            if self.phone_number is None:
                raise ValueError("phone_number is required for FTTH membership")

            if self.iban is None:
                raise ValueError("iban is required for FTTH membership")

            if self.payment_method_deposit is None:
                raise ValueError(
                    "payment_method_deposit is required for FTTH membership"
                )

        elif self.type == MembershipType.WIFI:
            if self.ssid is None:
                raise ValueError("ssid is required for WIFI membership")

        return self
