import { useEffect, useState } from "react";
import AppointmentSelection from "../../components/Appointment/AppointmentSelection";
import LoggedMenu from "../../components/Menus/LoggedMenu";
import { Api } from "../../utils/Api";
import { Appointment } from "../../utils/types";
import AppointmentsList from "../../components/Appointment/AppointmentsList";

export default function PageAppointment() {
    const [appointments, setAppointments] = useState<Appointment[]>(null);

    useEffect(() => {
        Api.fetchMyAppointments().then((data: Appointment[]) => {
            setAppointments(data);
        }).catch((error) => {
            alert("Erreur lors de la récupération des rendez-vous. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }, []);

    const onSubmitSelection = (selectedSlots) => {
        Api.submitMyAppointmentSlots(selectedSlots).then((data) => {
            setAppointments(data);
        }).catch((error) => {
            alert("Erreur lors de l'envoi des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }

    return (
        <>
            <LoggedMenu />
            {appointments === null && <p>Chargement...</p>}
            {appointments !== null && appointments.length === 0 && (
                <AppointmentSelection onSubmitSelection={onSubmitSelection} />
            )}
            {appointments !== null && appointments.length > 0 && (
                <AppointmentsList appointments={appointments} />
            )}
        </>
    )
}