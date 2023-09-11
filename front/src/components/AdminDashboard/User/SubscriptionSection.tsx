import { SubscriptionStatus, Subscription, UserDataBundle } from "../../../utils/types";
import { TextField, Button, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import { Api } from "../../../utils/Api";


export default function SubscriptionSection({ userBundle, setUserBundle, registerToSubFlowForm }: { userBundle: UserDataBundle, setUserBundle: any, registerToSubFlowForm: any }) {
    if (!userBundle) return (<>Chargement...</>);
    const [status, setStatus] = useState<SubscriptionStatus>(userBundle?.subscription.status);

    const onStatusChange = (event) => {
        setStatus(event.target.value);
    };

    const sendStatusChange = () => {
        Api.modifySubscription(userBundle?.subscription.subscription_id, { ...userBundle?.subscription, status: status })
            .then((updated) => {
                if (updated === null) {
                    alert("Erreur lors de la modification. Veuillez essayer de recharger la page.");
                    return;
                }
                setUserBundle({ ...userBundle, subscription: updated });
                setStatus(updated.status);
            }).catch((error) => {
                alert("Erreur lors de la modification. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
            });
    }

    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Adhésion <Typography fontSize={10}>{userBundle?.subscription.subscription_id}</Typography>
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Statut</strong>
                <div className="mb-3">
                    <Select fullWidth size="small" value={status} onChange={onStatusChange}>
                        {Object.values(SubscriptionStatus).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{SubscriptionStatus[key]}</MenuItem>)}
                    </Select>
                </div>
                <div className="mb-3">
                    {status !== userBundle?.subscription.status && (
                        <Button fullWidth color="error" variant="contained" onClick={sendStatusChange}>
                            Valider
                        </Button>
                    )}

                </div>
                <strong>Chambre</strong> : {userBundle?.subscription.chambre.name} - {userBundle?.subscription.chambre.residence}<br />
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