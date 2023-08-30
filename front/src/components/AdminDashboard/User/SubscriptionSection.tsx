import { Status, Subscription } from "../../../utils/types";
import { TextareaAutosize, Typography } from "@mui/material";

export default function SubscriptionSection({ subscription, registerToSubFlowForm }: { subscription: Subscription, registerToSubFlowForm: any }) {
    if (!subscription) return (<>Chargement...</>);

    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Adhésion <Typography fontSize={10}>{subscription.subscription_id}</Typography>
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Statut</strong> : {Status[subscription.status]}<br />
                <strong>Chambre</strong> : {subscription.chambre.name} - {subscription.chambre.residence}<br />
                <strong>Dolibarr</strong>
                <TextareaAutosize className="block mb-5" minRows={3} {...registerToSubFlowForm("dolibarr_information")} variant="outlined" placeholder="Lien Dolibarr"/>
            </Typography>
        </div>
    )
}