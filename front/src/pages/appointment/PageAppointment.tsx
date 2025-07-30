import AppointmentSelection from "../../components/Appointment/AppointmentSelection";
import AppointmentSlotList from "../../components/Appointment/AppointmentSlotList";
import Api from "../../utils/Api";
import { AppointmentSlot, User } from "../../utils/types/types";
import { useAuthContext } from "../auth/AuthContext";

export default function PageAppointment() {
    const { user, setUser } = useAuthContext();

    const onSubmitSelection = (selectedSlots: AppointmentSlot[]) => {
        Api.updateMyAvailabilities(selectedSlots).then((user: User) => {
            setUser({ ...user });
        }).catch((error) => {
            alert("Erreur lors de l'envoi des créneaux. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
        });
    }
    if (!user.membership.appointment && user.availability_slots.length === 0) {
        return <AppointmentSelection onSubmitSelection={onSubmitSelection} />;
    } else {
        return <AppointmentSlotList />;
    }
}