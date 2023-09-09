from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, validator

from back.database.appointments import AppointmentStatus, AppointmentType, DBAppointment


class AppointmentSlot(BaseModel):
    start: datetime
    end: datetime

    @validator("start", "end", pre=True)
    def parse_datetime(cls, v: str) -> datetime:
        """Parse datetime from iso string or datetime."""
        if isinstance(v, datetime):
            return v
        elif isinstance(v, str):
            return datetime.fromisoformat(v)

        raise ValueError("Invalid datetime format")

    class Config:
        json_encoders = {
            datetime: lambda d: d.isoformat(),
        }


class Appointment(BaseModel):
    appointment_id: UUID
    subscription_id: UUID
    slot: AppointmentSlot
    status: AppointmentStatus
    type: AppointmentType

    @classmethod
    def from_orm(cls, obj: DBAppointment) -> "Appointment":
        """Create a Appointment json response from a Appointment DB schema."""
        return cls(
            appointment_id=obj.appointment_id,
            subscription_id=obj.subscription_id,
            slot=AppointmentSlot(start=obj.slot_start, end=obj.slot_end),
            status=obj.status,
            type=obj.type,
        )
