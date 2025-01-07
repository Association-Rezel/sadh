from enum import Enum
from typing import Optional, Self
from uuid import UUID

from pydantic import AliasChoices, Field, model_validator

from back.mongodb.base import PortableDatetime, RezelBaseModel


class MembershipStatus(int, Enum):
    REQUEST_PENDING_VALIDATION = 100
    VALIDATED = 200
    SENT_CMD_ACCES = 300
    APPOINTMENT_VALIDATED = 400
    ACTIVE = 500
    PENDING_INACTIVE = 600
    INACTIVE = 700


class EquipmentStatus(int, Enum):
    PENDING_PROVISIONING = 1
    PROVISIONED = 2
    LENT = 3
    PARTIALLY_RETURNED = 4
    RETURNED = 5


class DepositStatus(int, Enum):
    NOT_DEPOSITED = 1
    PAID = 2
    REFUNDED = 3


class Residence(str, Enum):
    ALJT = "ALJT"
    TWENTY_CAMPUS = "TWENTY_CAMPUS"
    HACKER_HOUSE = "HACKER_HOUSE"
    KLEY = "KLEY"


class AppointmentType(int, Enum):
    RACCORDEMENT = 1


class Address(RezelBaseModel):
    residence: Residence = Field(...)
    appartement_id: str = Field(...)


class AppointmentSlot(RezelBaseModel):
    start: PortableDatetime = Field(...)
    end: PortableDatetime = Field(...)

    def __hash__(self) -> int:
        return hash((self.start, self.end))


class Appointment(RezelBaseModel):
    slot: AppointmentSlot = Field(...)
    type: AppointmentType = Field(...)


class PaymentMethod(str, Enum):
    CHEQUE = "CHEQUE"
    VIREMENT = "VIREMENT"
    ESPECE = "ESPECE"


class MembershipInitialization(RezelBaseModel):
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: Optional[PaymentMethod] = Field(None)
    main_unet_id: Optional[str] = Field(None)


class MembershipType(str, Enum):
    FTTH = "FTTH"
    WIFI = "WIFI"


class Membership(RezelBaseModel):
    type: MembershipType = Field(...)
    status: MembershipStatus = Field(...)
    address: Address = Field(...)
    comment: str = Field("")
    erdv_id: Optional[str] = Field(None)
    ref_commande: Optional[str] = Field(None)
    ref_prestation: Optional[str] = Field(None)
    equipment_status: EquipmentStatus = Field(...)
    deposit_status: DepositStatus = Field(...)
    cmd_acces_sent: bool = Field(False)
    cr_mes_sent: bool = Field(False)
    paid_first_month: bool = Field(False)
    contract_signed: bool = Field(False)
    appointment: Optional[Appointment] = Field(None)
    init: Optional[MembershipInitialization] = Field(None)
    unetid: Optional[str] = Field(None)
    documenso_contract_id: Optional[int] = Field(None)
    documenso_adherent_url: Optional[str] = Field(None)
    documenso_president_url: Optional[str] = Field(None)
    deleted_date: Optional[PortableDatetime] = Field(None)

    def redact_for_non_admin(self):
        self.comment = ""
        self.erdv_id = None
        self.ref_commande = None
        self.ref_prestation = None
        self.cmd_acces_sent = False
        self.cr_mes_sent = False
        self.documenso_contract_id = None
        self.documenso_president_url = None


class User(RezelBaseModel):
    id: UUID = Field(validation_alias=AliasChoices("id", "_id"))
    email: str = Field(...)
    phone_number: Optional[str] = Field(None)
    first_name: str = Field(...)
    last_name: str = Field(...)
    membership: Optional[Membership] = Field(None)
    availability_slots: set[AppointmentSlot] = Field([])
    dolibarr_id: Optional[int] = Field(None)
    prev_memberships: list[Membership] = Field([])

    def redact_for_non_admin(self):
        if self.membership and isinstance(self.membership, Membership):
            self.membership.redact_for_non_admin()


####
# Models used to communicate from the frontend, but not stored as is in the database
####


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
    paid_first_month: Optional[bool] = Field(None)
    contract_signed: Optional[bool] = Field(None)
    appointment: Optional[Appointment] = Field(None)


class UserUpdate(RezelBaseModel):
    phone_number: Optional[str] = Field(None)
    membership: Optional[Membership] = Field(None)
    availability_slots: Optional[set[AppointmentSlot]] = Field(None)


class MembershipRequest(RezelBaseModel):
    type: MembershipType = Field(...)
    ssid: Optional[str] = Field(None)
    phone_number: Optional[str] = Field(None)
    address: Address = Field(...)
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: Optional[str] = Field(None)

    @model_validator(mode="after")
    def _validate(self) -> Self:
        if self.type == MembershipType.FTTH:
            if self.phone_number is None:
                raise ValueError("phone_number is required for FTTH membership")
            if self.payment_method_deposit is None:
                raise ValueError(
                    "payment_method_deposit is required for FTTH membership"
                )
        elif self.type == MembershipType.WIFI:
            if self.ssid is None:
                raise ValueError("ssid is required for WIFI membership")
        return self
