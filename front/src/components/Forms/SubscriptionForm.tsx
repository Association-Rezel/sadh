import { Typography } from "@mui/material"
import { Status } from "../../utils/types"
import { Api } from "../../utils/Api";
import { AppStateContext } from "../../utils/AppState";
import { useContext } from "react";
import { useForm } from "react-hook-form"


type FormValues = {
    residence: string
    name: string
}

function onSubmitSubscription(event: FormValues) {
    Api.addMySubscription({
        residence: event.residence,
        name: event.name
    })
    .then((subscription) => {
        alert("Votre demande d'adhésion a bien été prise en compte. Vous recevrez prochainement un mail d'information.");
        console.log("subscription", subscription)
        window.location.href = "/";
    })
    .catch((error) => {
        alert("Erreur lors de la demande d'adhésion. Veuillez réessayer ultérieurement. Message d'erreur : " + error.message + "\nSi le problème persiste, veuillez contacter contact@rezel.net");
    });
}

function onModifySubscription(event: FormValues) {
    Api.modifyMySubscription({
        residence: event.residence,
        name: event.name
    })
    .then((subscription) => {
        alert("Votre modification a bien été prise en compte. Vous recevrez prochainement un mail d'information.");
        console.log("subscription", subscription)
        window.location.href = "/";
    })
    .catch((error) => {
        alert("Erreur lors du traitement de la modification. Veuillez réessayer ultérieurement. Message d'erreur : " + error.message + "\nSi le problème persiste, veuillez contacter contact@rezel.net");
    });
}

function SubscriptionFormEdit() {
    return (
        <>
            <Typography variant="h4" align="center" color="text.secondary" component="p" sx={{ marginTop: 7 }}>
                Modifier votre demande d'adhésion
            </Typography>
            <Typography variant="h5" align="center" color="text.secondary" component="div" sx={{ marginTop: 2 }}>
                {SubscriptionForm()}
            </Typography>
        </>
    )
}


function SubscriptionForm() {
    let appState = useContext(AppStateContext);

    const { register, handleSubmit } = useForm<FormValues>()
    
    return (
        <Typography variant="h5" align="center" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
            <form onSubmit={handleSubmit(appState.subscription?.status == Status.PENDING_VALIDATION ? onModifySubscription : onSubmitSubscription)}>
                <div>
                    <label>Nom de la résidence :</label>
                    <select name="residence" id="residence" {...register("residence")} defaultValue={appState.subscription?.chambre.residence}>
                        <option value="ALJT">ALJT</option>
                        <option value="TWENTY_CAMPUS">TWENTY CAMPUS</option>
                        <option value="HACKER_HOUSE">HACKER HOUSE</option>
                        <option value="KLEY">KLEY</option>
                    </select>
                </div>
                <div>
                    <label>Numéro de logement :</label>
                    <input required type="text" name="name" placeholder="Numéro de logement" {...register("name")} defaultValue={appState.subscription?.chambre.name} />
                </div>
                <div>
                    <input type="submit" value="Envoyer" />
                </div>
            </form>
        </Typography>
    )
}

export { SubscriptionForm, SubscriptionFormEdit }

