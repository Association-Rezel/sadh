import { Status, Subscription } from "../../../utils/types";
import { TextField, Button, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import { Api } from "../../../utils/Api";


export default function SubscriptionSection({ subscription, setSubscription, registerToSubFlowForm }: { subscription: Subscription, setSubscription: any, registerToSubFlowForm: any }) {
    if (!subscription) return (<>Chargement...</>);
    const [status, setStatus] = useState<Status>(subscription.status);

    const onStatusChange = (event) => {
        setStatus(event.target.value);
    };

    const sendStatusChange = () => {
        Api.modifySubscription(subscription.subscription_id, { ...subscription, status: status })
            .then((updated) => {
                if (updated === null) {
                    alert("Erreur lors de la modification. Veuillez essayer de recharger la page.");
                    return;
                }
                setSubscription(updated);
                setStatus(updated.status);
            }).catch((error) => {
                alert("Erreur lors de la modification. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
            });
    }

    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Adhésion <Typography fontSize={10}>{subscription.subscription_id}</Typography>
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Statut</strong>
                <div className="mb-3">
                    <Select fullWidth size="small" value={status} onChange={onStatusChange}>
                        {Object.values(Status).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{Status[key]}</MenuItem>)}
                    </Select>
                </div>
                <div className="mb-3">
                    {status !== subscription.status && (
                        <Button fullWidth color="error" variant="contained" onClick={sendStatusChange}>
                            Valider
                        </Button>
                    )}

                </div>
                <strong>Chambre</strong> : {subscription.chambre.name} - {subscription.chambre.residence}<br />
                <strong>Informations de paiement</strong>
                <div className="my-3">
                    <TextField multiline variant="outlined" className="bg-white w-80" minRows={3} {...registerToSubFlowForm("dolibarr_information")} placeholder="Lien Dolibarr" />
                </div>
                <div className="flex items-center">
                    <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToSubFlowForm("paid_caution")} />
                    <strong className="pl-2">Caution payée</strong>
                </div>
                <div className="flex items-center">
                    <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToSubFlowForm("paid_first_month")} />
                    <strong className="pl-2">Premier mois payé</strong>
                </div>
                <div className="flex items-center">
                    <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToSubFlowForm("contract_signed")} />
                    <strong className="pl-2">Contrat signé</strong>
                </div>
            </Typography>
        </div>
    )
}