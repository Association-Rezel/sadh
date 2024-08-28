from datetime import datetime, timedelta

from back.mongodb.user_models import AppointmentSlot


def get_week_appointment_slots(
    date: datetime, weekOffset: int
) -> list[AppointmentSlot]:
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
            # Check that the day is at least D+8
            if start > datetime.now() + timedelta(days=8):
                slots.append(AppointmentSlot(start=start, end=end))

    return slots
