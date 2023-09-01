import { useParams } from "react-router-dom";
import SubscriptionSection from "./SubscriptionSection";
import UserSection from "./UserSection";
import ONTSection from "./ONTSection";
import BoxSection from "./BoxSection";
import { useEffect, useMemo, useState } from "react";
import { Api } from "../../../utils/Api";
import { Subscription, SubscriptionFlow } from "../../../utils/types";
import { SubmitHandler, set, useForm } from "react-hook-form"
import AppointmentSection from "./AppointmentSection";
import InteropSection from "./InteropSection";
import { Button, Divider, Stack } from "@mui/material";


function User() {
    const { keycloak_id } = useParams<string>();
    const [subscription, setSubscription] = useState<Subscription>(null);
    const [currentSubFlow, setCurrentSubFlow] = useState<SubscriptionFlow>(null);
    const { register, handleSubmit, reset, formState } = useForm({
        defaultValues: currentSubFlow
    });

    const onSubmit: SubmitHandler<SubscriptionFlow> = (data) => {
        Api.modifySubscriptionFlow(data.subscription_id, data)
            .then((updated) => {
                if (updated === null) {
                    alert("Erreur lors de la modification. Veuillez essayer de recharger la page.");
                    return;
                }
                setCurrentSubFlow(updated);
                reset(data);
            }).catch((error) => {
                alert("Erreur lors de la modification. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
            });
    }

    useEffect(() => {
        if (subscription === null) {
            Api.fetchSubscription(keycloak_id).then(sub => {
                setSubscription(sub);
            });
        }
    }, [keycloak_id]);

    useEffect(() => {
        if (currentSubFlow === null && subscription !== null) {
            Api.fetchSubscriptionFlow(subscription.subscription_id).then(subscriptionFlow => {
                setCurrentSubFlow(subscriptionFlow);
                reset(subscriptionFlow);
            });
        }
    }, [subscription, reset]);
    return (
        <div>
            <UserSection keycloak_id={keycloak_id} />
            <Stack direction={"row"} spacing={4} alignItems={"center"} justifyContent={"space-between"} flexWrap="wrap" divider={<Divider orientation="vertical" flexItem />}>
                <SubscriptionSection subscription={subscription} setSubscription={setSubscription} registerToSubFlowForm={register} />
                <ONTSection keycloak_id={keycloak_id} registerToSubFlowForm={register} />
                <BoxSection currentSubFlow={currentSubFlow} registerToSubFlowForm={register} />
            </Stack>
            <div className="flex justify-between flex-wrap gap-x-20">
                <AppointmentSection currentSubFlow={currentSubFlow} registerToSubFlowForm={register} />
                <InteropSection currentSubFlow={currentSubFlow} registerToSubFlowForm={register} />
            </div>
            <div className="mt-10">
                <Button color="error" disabled={!formState.isDirty} variant={formState.isDirty ? "contained" : "outlined"} onClick={handleSubmit(onSubmit)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Enregistrer
                </Button>
            </div>
        </div>
    );
};

export default User;
