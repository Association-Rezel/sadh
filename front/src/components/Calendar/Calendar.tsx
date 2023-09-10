import { useEffect, useState } from "react";
import { Appointment, AppointmentStatus } from "../../utils/types";
import { Api } from "../../utils/Api";
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment)

function CalendarComponent() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        Api.fetchAppointments().then((appointments) => {
            setAppointments(appointments.filter((appointment) => appointment.status === AppointmentStatus.VALIDATED));
        });
    }, []);

    const getEvents = () => {
        let events = [];
        for (let appointment of appointments) {
            events.push({
                id: appointment.appointment_id,
                start: new Date(appointment.slot.start),
                end: new Date(appointment.slot.end),
                title: "Subscription " + appointment.subscription_id
            },);
        }
        console.log("events", events)
        return events;
    }


    return (
        <div className="mt-10">
            <Calendar
                events={getEvents()}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
            />
        </div>
    )
}

export default CalendarComponent;