from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class MembershipStatus(int, Enum):
    REQUEST_PENDING_VALIDATION = 1
    VALIDATED = 2
    REJECTED = 3
    ACTIVE = 4
    PENDING_INACTIVE = 5
    INACTIVE = 6


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


class Address(BaseModel):
    residence: Residence = Field(...)
    appartement_id: str = Field(...)


class AppointmentSlot(BaseModel):
    start: datetime = Field(...)
    end: datetime = Field(...)

    @field_validator("start", "end", mode="before")
    def parse_datetime(cls, v) -> datetime:
        """Parse datetime from iso string or datetime."""
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            return datetime.fromisoformat(v)

        raise ValueError("Invalid datetime format")

    class Config:
        json_encoders = {
            datetime: lambda d: d.isoformat(),
        }

    def __hash__(self) -> int:
        return hash((self.start, self.end))


class Appointment(BaseModel):
    slot: AppointmentSlot = Field(...)
    type: AppointmentType = Field(...)


class PaymentMethod(str, Enum):
    CHEQUE = "CHEQUE"
    VIREMENT = "VIREMENT"
    ESPECE = "ESPECE"


class MembershipInitialization(BaseModel):
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: PaymentMethod = Field(...)


class Membership(BaseModel):
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

    def redact_for_non_admin(self):
        self.comment = ""
        self.erdv_id = None
        self.ref_commande = None
        self.ref_prestation = None
        self.cmd_acces_sent = False
        self.cr_mes_sent = False
        self.paid_first_month = False
        self.contract_signed = False
        self.appointment = None
        self.unetid = None


class User(BaseModel):
    sub: str = Field(...)
    email: str = Field(...)
    phone_number: Optional[str] = Field(None)
    first_name: str = Field(...)
    last_name: str = Field(...)
    membership: Optional[Membership] = Field(None)
    availability_slots: set[AppointmentSlot] = Field([])


####
# Models used to communicate from the frontend, but not stored as is in the database
####


class MembershipUpdate(BaseModel):
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


class UserUpdate(BaseModel):
    phone_number: Optional[str] = Field(None)
    membership: Optional[Membership] = Field(None)
    availability_slots: Optional[set[AppointmentSlot]] = Field(None)


class MembershipRequest(BaseModel):
    phone_number: str = Field(...)
    address: Address = Field(...)
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: PaymentMethod = Field(...)
