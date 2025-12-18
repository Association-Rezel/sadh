import AppointmentSelection from "../../components/Appointment/AppointmentSelection";
import AppointmentSlotList from "../../components/Appointment/AppointmentSlotList";
import CheckPhoneNumber from "../../components/MembershipRequest/CheckPhoneNumber";
import Api from "../../utils/Api";
import { AppointmentSlot, User } from "../../utils/types/types";
import { useAuthContext } from "../auth/AuthContext";
import { useState, useEffect } from "react";

export default function PageAppointment() {
    const { user, setUser } = useAuthContext();
    const [ovhEnabled, setOvhEnabled] = useState<boolean|null>(null)
    useEffect(()=>{
        Api.isOvhEnabled().then(response => setOvhEnabled(response))
    })
    const onSubmitSelection = (selectedSlots: AppointmentSlot[]) => {
        Api.updateMyAvailabilities(selectedSlots).then((user: User) => {
            setUser({ ...user });
        }).catch((error) => {
            alert("Erreur lors de l'envoi des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }
    if (ovhEnabled === null){
        return <div>Chargement...</div>;
    }else{
        if (!user.membership.appointment && user.availability_slots.length === 0) {
            return <AppointmentSelection onSubmitSelection={onSubmitSelection} />;
        } else if (!user.phone_number_verified && ovhEnabled && user.phone_number.startsWith("+33")) {
            return <CheckPhoneNumber/>;
        } else {
            return <AppointmentSlotList />;
        }
    } 
}