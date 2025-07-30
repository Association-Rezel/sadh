import { useEffect, useState } from "react";
import { Appointment, User } from "../../utils/types/types";
import Api from "../../utils/Api";
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
        Api.fetchUsers().then((users) => {
            const calendarPropsNew = [];
            for (let user of users) {
                if (user.membership?.appointment) {
                    calendarPropsNew.push({
                        appointment: user.membership.appointment,
                        user: user
                    })
                }   
            }
            setCalendarProps(calendarPropsNew);
        });
    }, []);

    const getEvents = () => {
        let events = [];
        for (let calendarProp of calendarProps) {
            events.push({
                start: new Date(calendarProp.appointment.slot.start),
                end: new Date(calendarProp.appointment.slot.end),
                title: calendarProp.user.first_name + " " + calendarProp.user.last_name,
                userid: calendarProp.user.id,
            },);
        }
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