import { useEffect, useState } from "react";
import { Appointment, AppointmentStatus, User } from "../../utils/types";
import { Api } from "../../utils/Api";
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from "react-router-dom";

const localizer = momentLocalizer(moment)

interface CalendarProp {
    appointment: Appointment;
    user: User;
}


function CalendarComponent() {
    const [calendarProps, setCalendarProps] = useState<CalendarProp[]>([]);

    useEffect(() => {
        Api.fetchUserDataBundles().then((userBundles) => {
            const calendarPropsNew = [];
            for (let userBundle of userBundles) {
                for (let appointment of userBundle.appointments) {
                    if (appointment.status === AppointmentStatus.VALIDATED) {
                        calendarPropsNew.push({
                            appointment: appointment,
                            user: userBundle.user
                        })
                    }
                }   
            }
            setCalendarProps(calendarPropsNew);
        });
    }, []);

    const getEvents = () => {
        let events = [];
        for (let calendarProp of calendarProps) {
            events.push({
                id: calendarProp.appointment.appointment_id,
                start: new Date(calendarProp.appointment.slot.start),
                end: new Date(calendarProp.appointment.slot.end),
                title: calendarProp.user.name,
                userid: calendarProp.user.keycloak_id,
            },);
        }
        console.log("events", events)
        return events;
    }

    const navigate = useNavigate();
    const handleSelectEvent = (event,target) => {
        navigate(`/admin/users/${event.userid}`);
    }

    return (
        <div className="mt-10">
            <Calendar
                events={getEvents()}
                localizer={localizer}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onSelectEvent={handleSelectEvent} 
            />
        </div>
    )
}

export default CalendarComponent;