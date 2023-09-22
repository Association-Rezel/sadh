import { Appointment, AppointmentSlot, AppointmentStatus, UserDataBundle } from "../../../utils/types";
import { Button, IconButton, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Check, Delete, Margin } from "@mui/icons-material";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useState } from "react";
import dayjs, { Dayjs } from 'dayjs';
import { set } from "react-hook-form";


export default function AppointmentSection({ userBundle, setUserBundle, registerToSubFlowForm }: { userBundle: UserDataBundle, setUserBundle: any, registerToSubFlowForm: any }) {
    const currentSubFlow = userBundle?.flow;
    const [startDate, setStartDate] = useState<Dayjs>(dayjs());

    const onDeleteAppointment = (appointment: Appointment) => {
        Api.deleteAppointment(appointment.appointment_id).then(() => {
            userBundle.appointments = userBundle?.appointments.filter((a) => a.appointment_id !== appointment.appointment_id);
            setUserBundle({ ...userBundle});
        }).catch((error) => {
            alert("Erreur lors de la suppression du rendez-vous. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }

    const onValidateAppointment = (appointment: Appointment) => {
        appointment.status = AppointmentStatus.VALIDATED;
        Api.modifyAppointmentStatus(appointment.appointment_id, appointment).then((modified: Appointment) => {
            appointment.status = modified.status;
            setUserBundle(userBundle);
        }).catch((error) => {
            alert("Erreur lors de la validation du rendez-vous. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }

    const addAppointment = () => {
        const selectedSlots: AppointmentSlot[] = [];
        selectedSlots.push({
            start: startDate.toDate(),
            end: startDate.add(2, "hour").toDate()
        });
        Api.submitAppointmentSlots(userBundle.user.keycloak_id, selectedSlots).then((data) => {
            userBundle.appointments = userBundle?.appointments.concat(data);
            setUserBundle({ ...userBundle});
        }).catch((error) => {
            alert("Erreur lors de l'envoi des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    };

    const appointments = userBundle?.appointments;

    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Rendez-vous
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {currentSubFlow === null && appointments === null && <p>Chargement...</p>}
                {currentSubFlow !== null && appointments !== null && (
                    <>
                        <strong>Créneaux</strong>
                        {appointments.length === 0 && <p>Aucun créneau renseigné</p>}
                        <div className="mb-3">
                            {appointments.map((appointment) =>
                                <AppointmentComponent
                                    key={appointment.slot.start.getTime()}
                                    appointment={appointment}
                                    onlyOption={appointments.length === 1}
                                    onDelete={() => onDeleteAppointment(appointment)}
                                    onValidate={() => onValidateAppointment(appointment)}
                                />)}
                        </div>
                        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={['DateTimePicker']}>
                                    <DateTimePicker
                                        label="Heure de début du créneau"
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                    />
                                </DemoContainer>
                            </LocalizationProvider>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={addAppointment}>
                                Ajouter le créneau
                            </Button>
                        </div>
                        <strong>Informations</strong>
                        <div>
                            <TextField multiline fullWidth variant="outlined" className="bg-white" minRows={3} {...registerToSubFlowForm("erdv_information")} />
                        </div>
                        <div className="mt-5">
                            <strong>ID E-RDV</strong>
                            <TextField className="bg-white" size="small" fullWidth {...registerToSubFlowForm("erdv_id")} />
                        </div>
                        <div className="mt-5">
                            <strong>Personne présente au rdv</strong>
                            <TextField className="bg-white" size="small" fullWidth {...registerToSubFlowForm("present_for_appointment")} />
                        </div>
                    </>
                )}
            </Typography>
        </div>
    )
}

function AppointmentComponent({ appointment, onlyOption, onDelete, onValidate }: { appointment: Appointment, onlyOption: boolean, onDelete: any, onValidate: any }) {
    return (
        <div className="my-5 flex flex-row items-center">
            <Typography variant="body1">
                <b>{appointment.slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "numeric" })}</b>
                &nbsp;de <b>{appointment.slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                &nbsp;à <b>{appointment.slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
            </Typography>
            {appointment.status === AppointmentStatus.VALIDATED &&
                <Typography
                    variant="body1"
                    sx={{ marginLeft: 3 }}
                    fontWeight="bold"
                    color="green">
                    VALIDÉ
                </Typography>}
            {appointment.status === AppointmentStatus.PENDING_VALIDATION && (
                <>
                    <IconButton color="success" disabled={!onlyOption} onClick={onValidate}>
                        <Check />
                    </IconButton>
                    <IconButton color="error" disabled={onlyOption} onClick={onDelete}>
                        <Delete />
                    </IconButton>
                </>
            )}
        </div>
    )
}