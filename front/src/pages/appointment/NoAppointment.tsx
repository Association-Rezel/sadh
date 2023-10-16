import { useContext } from "react";
import { AppStateContext } from "../../utils/AppState";


export default function NoAppointment() {
    const appState = useContext(AppStateContext);

    return (
        <>       
            {typeof appState.subscription?.status ==='undefined' ? (
                "Vous n'avez pas encore fait de demande d'adhésion."
            ) : (
                "Votre adhésion est en état "+appState.subscription?.status+", vous ne pouvez pas choisir de créneau de rendez-vous."
            )}
            
        </>
    )
}