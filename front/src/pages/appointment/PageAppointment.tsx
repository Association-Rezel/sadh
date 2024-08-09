import { useContext, useEffect, useState } from "react";
import AppointmentSelection from "../../components/Appointment/AppointmentSelection";
import { Api } from "../../utils/Api";
import { Appointment, AppointmentSlot, MembershipStatus, User } from "../../utils/types/types";
import AppointmentSlotList from "../../components/Appointment/AppointmentSlotList";
import { AppStateContext } from "../../utils/AppStateContext";

export default function PageAppointment() {
    const { appState, updateAppState } = useContext(AppStateContext);

    const onSubmitSelection = (selectedSlots: AppointmentSlot[]) => {
        Api.updateMyAvailabilities(selectedSlots).then((user: User) => {
            updateAppState({ user: {...user} });
        }).catch((error) => {
            alert("Erreur lors de l'envoi des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }
    if (!appState.user.membership.appointment && appState.user.availability_slots.length === 0) {
        return <AppointmentSelection onSubmitSelection={onSubmitSelection} />;
    } else {
        return <AppointmentSlotList />;
    }
}