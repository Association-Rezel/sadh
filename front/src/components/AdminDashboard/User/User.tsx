import { useParams } from "react-router-dom";
import SubscriptionSection from "./SubscriptionSection";
import UserSection from "./UserSection";
import ONTSection from "./ONTSection";
import BoxSection from "./BoxSection";
import { useEffect, useState } from "react";
import { Api } from "../../../utils/Api";
import { SubscriptionFlow, UserDataBundle } from "../../../utils/types";
import { SubmitHandler, useForm } from "react-hook-form"
import AppointmentSection from "./AppointmentSection";
import InteropSection from "./InteropSection";
import { Button, Divider, Stack, Typography } from "@mui/material";
import ContractUpload from "./ContractUpload";


function User() {
    const { keycloak_id } = useParams<string>();
    const [userBundle, setUserBundle] = useState<UserDataBundle>(null);
    const { register, handleSubmit, reset, formState } = useForm({
        defaultValues: userBundle?.flow
    });

    const onSubmit: SubmitHandler<SubscriptionFlow> = (data) => {
        Api.modifySubscriptionFlow(data.flow_id, data)
            .then((updated) => {
                if (updated === null) {
                    alert("Erreur lors de la modification. Veuillez essayer de recharger la page.");
                    return;
                }
                setUserBundle({ ...userBundle, flow: updated });
                reset(data);
            }).catch((error) => {
                alert("Erreur lors de la modification. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
            });
    }

    useEffect(() => {
        Api.fetchUserDataBundle(keycloak_id).then((bundle: UserDataBundle) => {
            setUserBundle(bundle);
            reset(bundle.flow);
        });
    }, [keycloak_id]);

    //Hotfix for users without subscrption flow, because fetching the subscription flow if it does not exist will create it
    useEffect(() => {
        if (userBundle?.subscription && !userBundle?.flow) {
            Api.fetchSubscriptionFlow(userBundle.subscription.subscription_id)
        }
    }, [userBundle])

    return (
        <div>
            <UserSection keycloak_id={keycloak_id} />
            {!userBundle && <p>Chargement...</p>}
            {userBundle && !userBundle?.subscription && <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>Aucune adhésion trouvée</Typography>}
            {userBundle && userBundle?.subscription && (
                <>
                    <Stack direction={"row"} spacing={4} alignItems={"center"} justifyContent={"space-between"} flexWrap="wrap" divider={<Divider orientation="vertical" flexItem />}>
                        <SubscriptionSection userBundle={userBundle} setUserBundle={setUserBundle} registerToSubFlowForm={register} />
                        <ONTSection keycloak_id={keycloak_id} registerToSubFlowForm={register} />
                        <BoxSection keycloak_id={keycloak_id} currentSubFlow={userBundle?.flow} registerToSubFlowForm={register} />
                    </Stack>
                    <div className="flex justify-between flex-wrap gap-x-20">
                        <AppointmentSection userBundle={userBundle} setUserBundle={setUserBundle} registerToSubFlowForm={register} />
                        <InteropSection currentSubFlow={userBundle?.flow} registerToSubFlowForm={register} userBundle={userBundle} />
                        <ContractUpload keycloak_id={keycloak_id} />
                    </div>
                    <div className="mt-10">
                        <Button color="error" disabled={!formState.isDirty} variant={formState.isDirty ? "contained" : "outlined"} onClick={handleSubmit(onSubmit)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Enregistrer
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default User;
