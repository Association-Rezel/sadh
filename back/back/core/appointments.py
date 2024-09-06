from datetime import datetime, timedelta

from back.mongodb.user_models import AppointmentSlot


def get_week_appointment_slots(
    date: datetime, week_offset: int
) -> list[AppointmentSlot]:
    """Get all available slots in the week of the given date."""
    # For the moment slots are hardcoded

    start_of_week = date - timedelta(days=date.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    hour_slots = [(8, 11), (10, 13), (13, 16), (15, 18)]
    timezone_delta = 2

    start_of_week = date - timedelta(days=date.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week += timedelta(days=week_offset * 7)

    slots: list[AppointmentSlot] = []
    for i in range(0, 6):
        day = start_of_week + timedelta(days=i)
        for slot in hour_slots:
            start = day.replace(hour=slot[0] - timezone_delta)
            end = day.replace(hour=slot[1] - timezone_delta)
            # Check that the day is at least D+8
            if start > datetime.now() + timedelta(days=8):
                slots.append(AppointmentSlot(start=start, end=end))

    return slots
