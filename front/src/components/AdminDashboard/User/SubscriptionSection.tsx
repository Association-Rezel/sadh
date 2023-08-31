import { Status, Subscription } from "../../../utils/types";
import { Typography } from "@mui/material";
import { Textarea } from "@mui/joy";


export default function SubscriptionSection({ subscription, registerToSubFlowForm }: { subscription: Subscription, registerToSubFlowForm: any }) {
    if (!subscription) return (<>Chargement...</>);

    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Adhésion <Typography fontSize={10}>{subscription.subscription_id}</Typography>
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Statut</strong> : {Status[subscription.status]}<br />
                <strong>Chambre</strong> : {subscription.chambre.name} - {subscription.chambre.residence}<br />
                <strong>Dolibarr</strong>
                <Textarea className="w-80" minRows={3} {...registerToSubFlowForm("dolibarr_information")} variant="outlined" placeholder="Lien Dolibarr"/>
            </Typography>
        </div>
    )
}