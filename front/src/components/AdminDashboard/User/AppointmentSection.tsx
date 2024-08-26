import { AppointmentSlot, AppointmentType, Membership, User, isSameSlot } from "../../../utils/types/types";
import { Button, IconButton, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Check, Delete } from "@mui/icons-material";
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/fr';

dayjs.extend(utc);
dayjs.extend(timezone);


export default function AppointmentSection({ user, setUser, registerToMembershipUpdateForm }: { user: User, setUser: any, registerToMembershipUpdateForm: any }) {
    const [newSlotStart, setNewSlotStart] = useState<Dayjs>(dayjs());

    useEffect(() => {
        setNewSlotStart(dayjs());
    }, []);

const syncAvailabilitySlots = () => {
    Api.updateUser(
        user.id,
        {
            availability_slots: user.availability_slots,
        }).then((user: User) => {
            setUser(user);
        }).catch((error) => {
            alert("Erreur lors de la synchronisation des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
}

const syncAppointment = () => {
    Api.updateMembership(
        user.id,
        {
            appointment: user.membership.appointment,
        }).then((user: User) => {
            setUser(user);
        }).catch((error) => {
            alert("Erreur lors de la synchronisation des rendez-vous. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
}

const onDeleteAppointment = () => {
    user.membership.appointment = null;
    syncAppointment();
}

const onDeleteSlot = (slot: AppointmentSlot) => {
    user.availability_slots.splice(user.availability_slots.indexOf(slot), 1);
    syncAvailabilitySlots();
}

const onAddSlot = () => {

    const newSlot = {
        start: newSlotStart.toDate(),
        end: newSlotStart.add(2, "hour").toDate()
    }

    if ([...user.availability_slots, user.membership?.appointment?.slot].filter((slot) => isSameSlot(slot, newSlot)).length > 0)
        return alert("Ce créneau existe déjà");

    user.availability_slots.push(newSlot);
    syncAvailabilitySlots();
};

const onValidateSlot = (slot: AppointmentSlot) => {
    user.availability_slots.splice(user.availability_slots.indexOf(slot), 1);
    user.membership.appointment = {
        slot: slot,
        type: AppointmentType.RACCORDEMENT,
    };

    syncAppointment();
    syncAvailabilitySlots();
}

return (
    <div className="mt-10 max-w-xs">
        <Typography variant="h5" align="left" color="text.primary" component="div">
            Rendez-vous
        </Typography>
        <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
            {user.availability_slots === null && <p>Chargement...</p>}
            {user.membership?.appointment && (
                <>
                    <strong>Rendez-vous</strong>
                    <SlotComponent
                        slot={user.membership.appointment.slot}
                        canValidate={false}
                        onDelete={() => onDeleteAppointment()}
                        onValidate={() => console.log("Cannot validate an appointment")}
                        isAppointment={true}
                    />
                </>
            )}
            {user.availability_slots !== null && (
                <>
                    <strong>Créneaux</strong>
                    {user.availability_slots.length === 0 && <p>Aucun créneau renseigné</p>}
                    <div className="mb-3">
                        {user.availability_slots.map((slot) =>
                            <SlotComponent
                                key={slot.start.getTime() + '.' + slot.end.getTime()}
                                slot={slot}
                                canValidate={user.membership?.appointment === null}
                                onDelete={() => onDeleteSlot(slot)}
                                onValidate={() => onValidateSlot(slot)}
                                isAppointment={false}
                            />)}
                    </div>
                    <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                            <DemoContainer components={['DateTimePicker']}>
                                <DateTimePicker
                                    label="Heure de début du créneau (2h)"
                                    value={newSlotStart}
                                    timezone="Europe/Paris"
                                    onChange={(newValue) => setNewSlotStart(newValue)}
                                />
                            </DemoContainer>
                        </LocalizationProvider>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onAddSlot}>
                            Ajouter le créneau
                        </Button>
                    </div>
                    <strong>Informations</strong>
                    <div>
                        <TextField multiline fullWidth variant="outlined" className="bg-white" minRows={3} {...registerToMembershipUpdateForm("comment")} />
                    </div>
                    <div className="mt-5">
                        <strong>ID E-RDV</strong>
                        <TextField className="bg-white" size="small" fullWidth {...registerToMembershipUpdateForm("erdv_id")} />
                    </div>
                </>
            )}
        </Typography>
    </div>
)
}

function SlotComponent({
    slot,
    canValidate,
    onDelete,
    onValidate,
    isAppointment,
}: {
    slot: AppointmentSlot,
    canValidate: boolean,
    onDelete: any,
    onValidate: any,
    isAppointment: boolean,
}) {
    return (
        <div className="my-5 flex flex-row items-center">
            <Typography variant="body1">
                <b>{slot.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "numeric" })}</b>
                &nbsp;de <b>{slot.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
                &nbsp;à <b>{slot.end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</b>
            </Typography>
            {isAppointment &&
                <Typography
                    variant="body1"
                    sx={{ marginLeft: 3 }}
                    fontWeight="bold"
                    color="green">
                    VALIDÉ
                </Typography>}
            {!isAppointment && (
                <IconButton color="success" disabled={!canValidate} onClick={onValidate}>
                    <Check />
                </IconButton>
            )}
            <IconButton color="error" onClick={onDelete}>
                <Delete />
            </IconButton>
        </div>
    )
}