from datetime import datetime

from common_models.user_models import AppointmentSlot
from fastapi import APIRouter

from back.core.appointments import get_week_appointment_slots

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("/weekSlots", response_model=list[list[AppointmentSlot]])
async def _get_week_slots(
    weekOffset: int = 0,
) -> list[list[AppointmentSlot]]:
    """Get all slots in the week of the given date, grouped by day."""
    week_slots = get_week_appointment_slots(datetime.now(), weekOffset)

    week_slots_per_day: list[list[AppointmentSlot]] = [[] for _ in range(0, 6)]
    for slot in week_slots:
        week_slots_per_day[slot.start.weekday()].append(slot)

    week_slots_per_day = list(filter(lambda day: len(day) > 0, week_slots_per_day))
    week_slots_per_day.sort(key=lambda day: day[0].start.timestamp())

    return week_slots_per_day
