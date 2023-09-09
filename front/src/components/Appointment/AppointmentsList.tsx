import { Typography } from "@mui/material";
import { Appointment, AppointmentStatus } from "../../utils/types";

export default function AppointmentsList({ appointments }: { appointments: Appointment[] }) {
    // Pour l'instant on ne gère que :
    // - 1 rendez-vous validé
    // - Plusieurs rendez-vous en attente
    // Sinon on affiche un message d'erreur
    return (
        <div className="mt-10">
            <Typography variant="h2">Rendez-vous</Typography>
            {appointments.length === 1 &&
                appointments[0].status === AppointmentStatus.VALIDATED &&
                <ValidatedAppointment appointment={appointments[0]} />}
            {!appointments.some(a => a.status === AppointmentStatus.VALIDATED) && (
                <>
                    <Typography variant="body1" align="center">
                        Votre rendez-vous pour le raccordement à la fibre n'a pas encore été validé. Vous avez indiqué les disponibilités suivantes :
                    </Typography>
                    {appointments.map((appointment) => <PendingAppointment key={appointment.slot.start.getTime()} appointment={appointment} />)}
                    <Typography variant="body1" align="center">
                        Si vous souhaitez modifier vos disponibilités, veuillez envoyer un mail à faipp@rezel.net
                    </Typography>
                </>
            )}
            {appointments.length !== 1 && appointments.some(a => a.status === AppointmentStatus.VALIDATED) && (
                <Typography variant="body1" align="center">
                    Une erreur est survenue. Veuillez envoyer un mail à faipp@rezel.net.
                </Typography>
            )}
        </div>
    )
}

export function ValidatedAppointment({ appointment }: { appointment: Appointment }) {
    return (
        <div className="mt-12 w-4/12">
            <Typography variant="body1" align="center">
                Votre rendez-vous aura lieu le
                <b>{appointment.slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</b>
                de <b>{appointment.slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                à <b>{appointment.slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>.
                <br />
                <br />
                Un technicien se présentera à votre domicile sur ce créneau pour effectuer le raccordement.
                Le rendez-vous peut durer jusqu'à 1 heure au delà du créneau d'arrivée du technicien.
            </Typography>
        </div>
    )
}

export function PendingAppointment({ appointment }: { appointment: Appointment }) {
    return (
        <div className="my-5">
            <Typography variant="body1" align="center">
                <b>{appointment.slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</b>
                &nbsp;de <b>{appointment.slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                &nbsp;à <b>{appointment.slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
            </Typography>
        </div>
    )
}