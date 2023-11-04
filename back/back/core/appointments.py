from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from back.database.appointments import AppointmentStatus, DBAppointment
from back.interfaces.appointments import Appointment, AppointmentSlot


def get_appointments(
    db: Session, start: datetime | None = None, end: datetime | None = None, status: AppointmentStatus | None = None
) -> list[Appointment]:
    """Get all appointments in the given time range."""

    statement = select(DBAppointment)

    if start:
        statement = statement.where(DBAppointment.slot_start >= start)

    if end:
        statement = statement.where(DBAppointment.slot_end <= end)

    if status:
        statement = statement.where(DBAppointment.status == status)

    return list(
        map(
            Appointment.from_orm,
            db.execute(statement).scalars().all(),
        )
    )


def get_week_appointment_slots(db: Session, date: datetime, weekOffset: int) -> list[AppointmentSlot]:
    """Get all available slots in the week of the given date."""
    # For the moment slots are hardcoded

    startOfWeek = date - timedelta(days=date.weekday())
    startOfWeek = startOfWeek.replace(hour=0, minute=0, second=0, microsecond=0)

    hourSlots = [(8, 11), (10, 13), (13, 16), (15, 18)]

    startOfWeek = date - timedelta(days=date.weekday())
    startOfWeek = startOfWeek.replace(hour=0, minute=0, second=0, microsecond=0)
    startOfWeek += timedelta(days=weekOffset * 7)

    slots: list[AppointmentSlot] = []
    for i in range(0, 6):
        day = startOfWeek + timedelta(days=i)
        for slot in hourSlots:
            start = day.replace(hour=slot[0])
            end = day.replace(hour=slot[1])
            slots.append(AppointmentSlot(start=start, end=end))

    return slots


def get_subscription_appointments(db: Session, sub_id: UUID) -> list[Appointment]:
    """Get all appointments of the given user."""

    statement = select(DBAppointment).where(
        DBAppointment.subscription_id == sub_id,
    )

    return list(
        map(
            Appointment.from_orm,
            db.execute(statement).scalars().all(),
        )
    )


def delete_appointment(db: Session, appointment_id: str) -> bool:
    """Delete an appointment. Returns True if the appointment existed and has been deleted."""
    statement = select(DBAppointment).where(
        DBAppointment.appointment_id == appointment_id,
    )
    appointment = db.execute(statement).scalars().first()
    if not appointment:
        return False
    db.delete(appointment)
    db.commit()
    return True


def update_appointment(db: Session, appointment_id: str, appointment: Appointment) -> Appointment | None:
    """Update the status of an Appointment ."""
    statement = select(DBAppointment).where(
        DBAppointment.appointment_id == appointment_id,
    )
    db_appointment = db.execute(statement).scalars().first()
    if not db_appointment:
        return None
    db_appointment.status = appointment.status
    db_appointment.type = appointment.type
    db_appointment.slot_start = appointment.slot.start.isoformat()
    db_appointment.slot_end = appointment.slot.end.isoformat()
    db.commit()
    return Appointment.from_orm(db_appointment)
