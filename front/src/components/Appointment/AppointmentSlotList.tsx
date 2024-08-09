import { Typography } from "@mui/material";
import { Appointment, AppointmentSlot, User } from "../../utils/types/types";
import { useContext } from "react";
import { AppStateContext } from "../../utils/AppStateContext";

export default function AppointmentSlotList() {
    const { appState } = useContext(AppStateContext);
    // Pour l'instant on ne gère que :
    // - 1 rendez-vous validé
    // - Plusieurs rendez-vous en attente
    // Sinon on affiche un message d'erreur
    return (
        <div className="mt-10 flex flex-col items-center">
            <Typography variant="h2">Rendez-vous</Typography>
            { appState.user.membership.appointment &&
                <ValidatedAppointment appointment={appState.user.membership.appointment} />}
            {!appState.user.membership.appointment && (
                <>
                    <Typography variant="body1" align="center">
                        Votre rendez-vous pour le raccordement à la fibre n'a pas encore été validé. Vous avez indiqué les disponibilités suivantes :
                    </Typography>
                    {appState.user.availability_slots.map((slot) => <AvailabilitySlot key={slot.start.getTime() + '.' + slot.end.getTime()} slot={slot} />)}
                    <Typography variant="body1" align="center">
                        Si vous souhaitez modifier vos disponibilités, veuillez envoyer un mail au plus vite à fai@rezel.net
                    </Typography>
                </>
            )}
        </div>
    )
}

export function ValidatedAppointment({ appointment }: { appointment: Appointment }) {
    return (
        <div className="mt-12 max-w-md">
            <Typography variant="body1" align="center">
                Votre rendez-vous aura lieu le <br />
                <br />
                <b>{appointment.slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</b>
                &nbsp;de <b>{appointment.slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                &nbsp;à <b>{appointment.slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>.
            </Typography>
            <div className="my-5"></div>
            <Typography variant="body1" align="justify">
                Un technicien se présentera à votre domicile sur ce créneau pour effectuer le raccordement.
                Le rendez-vous peut durer jusqu'à 1 heure au delà du créneau d'arrivée du technicien.
            </Typography>
        </div>
    )
}

export function AvailabilitySlot({ slot }: { slot: AppointmentSlot }) {
    return (
        <div className="my-5">
            <Typography variant="body1" align="center">
                <b>{slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</b>
                &nbsp;de <b>{slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                &nbsp;à <b>{slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
            </Typography>
        </div>
    )
}