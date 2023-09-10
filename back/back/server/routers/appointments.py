"""Manage subscriptions."""

from datetime import datetime

from fastapi import HTTPException, Response

from back.core.appointments import delete_appointment, get_appointments, get_week_appointment_slots, update_appointment
from back.database import Session
from back.database.appointments import AppointmentStatus
from back.interfaces.appointments import Appointment, AppointmentSlot
from back.interfaces.users import User
from back.middlewares import db, must_be_admin, user
from back.utils.router_manager import ROUTEURS

router = ROUTEURS.new("appointments")


@router.get("/")
async def _get_appointments(
    start: datetime | None = None,
    end: datetime | None = None,
    _db: Session = db,
    _: None = must_be_admin,
) -> list[Appointment]:
    """Get all appointments in the given time range."""
    return get_appointments(_db, start, end)


@router.get("/weekSlots")
async def _get_week_slots(
    weekOffset: int = 0,
    _user: User = user,
    _db: Session = db,
) -> list[list[AppointmentSlot]]:
    """Get all slots in the week of the given date, grouped by day."""
    week_slots = get_week_appointment_slots(_db, datetime.now(), weekOffset)

    week_slots_per_day: list[list[AppointmentSlot]] = [[] for _ in range(0, 6)]
    for slot in week_slots:
        week_slots_per_day[slot.start.weekday()].append(slot)

    week_slots_per_day = list(filter(lambda day: len(day) > 0, week_slots_per_day))
    week_slots_per_day.sort(key=lambda day: day[0].start.timestamp())

    return week_slots_per_day


@router.put("/{appointment_id}")
async def _update_appointment(
    appointment_id: str,
    appointment: Appointment,
    _db: Session = db,
    _: None = must_be_admin,
) -> Appointment:
    """Update the status of an Appointment ."""
    updated = update_appointment(_db, appointment_id, appointment)
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    else:
        return updated


@router.delete("/{appointment_id}")
async def _delete_appointment(
    appointment_id: str,
    _db: Session = db,
    _: None = must_be_admin,
) -> Response:
    """Delete an Appointment."""
    delete_appointment(_db, appointment_id)
    return Response(status_code=200)
