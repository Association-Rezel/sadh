from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

import pytz
from pydantic import AliasChoices, BaseModel, Field, field_validator


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


class Address(BaseModel):
    residence: Residence = Field(...)
    appartement_id: str = Field(...)


class AppointmentSlot(BaseModel):
    start: datetime = Field(...)
    end: datetime = Field(...)

    @field_validator("start", "end", mode="before")
    @classmethod
    def parse_datetime(cls, v) -> datetime:
        """Parse datetime from iso string or datetime."""
        if isinstance(v, datetime):
            return v
        if isinstance(v, float) or isinstance(v, int):
            # We use Europe/Paris timezone so that when it is formatted to string
            # (e.g. in emails or matrix messages) it is displayed in the correct timezone
            # It does NOT change the value of the datetime object, just the way it is displayed
            # when using python.
            # The front-end is being communicated the datetime as a timestamp, so it will
            # display it in the timezone of the browser.
            return datetime.fromtimestamp(v, tz=pytz.timezone("Europe/Paris"))

        raise ValueError("Invalid datetime format")

    class Config:
        json_encoders = {
            datetime: lambda d: d.timestamp(),
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


class MembershipType(str, Enum):
    FTTH = "FTTH"
    WIFI = "WIFI"


class Membership(BaseModel):
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

    def redact_for_non_admin(self):
        self.comment = ""
        self.erdv_id = None
        self.ref_commande = None
        self.ref_prestation = None
        self.cmd_acces_sent = False
        self.cr_mes_sent = False
        self.unetid = None


class User(BaseModel):
    id: UUID = Field(validation_alias=AliasChoices("id", "_id"))
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


class FTTHMembershipRequest(BaseModel):
    phone_number: str = Field(...)
    address: Address = Field(...)
    payment_method_first_month: PaymentMethod = Field(...)
    payment_method_deposit: PaymentMethod = Field(...)
