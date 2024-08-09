import { useParams } from "react-router-dom";
import MembershipSection from "./MembershipSection";
import UserSection from "./UserSection";
import ONTSection from "./ONTSection";
import BoxSection from "./BoxSection";
import { useEffect, useState } from "react";
import { Api } from "../../../utils/Api";
import { Membership, User } from "../../../utils/types/types";
import { SubmitHandler, useForm } from "react-hook-form"
import AppointmentSection from "./AppointmentSection";
import InteropSection from "./InteropSection";
import { Button, Divider, Stack, Typography } from "@mui/material";
import ContractUpload from "./ContractUpload";


function UserComponent() {
    const { zitadel_sub } = useParams<string>();
    const [user, setUser] = useState<User>(null);
    const { register, handleSubmit, reset, formState, control } = useForm({
        defaultValues: user?.membership
    });

    const onSubmit: SubmitHandler<Membership> = (membership: Membership) => {
        Api.updateMembership(user.sub, membership)
            .then((updatedUser) => {
                if (updatedUser === null) {
                    alert("Erreur lors de la modification. Veuillez essayer de recharger la page.");
                    return;
                }
                setUser(updatedUser);
                reset(updatedUser.membership);
            }).catch((error) => {
                alert("Erreur lors de la modification. Veuillez essayer de recharger la page. Message d'erreur : " + error.message);
            });
    }

    useEffect(() => {
        Api.fetchUser(zitadel_sub).then((user: User) => {
            setUser(user);
            reset(user.membership);
        });
    }, [zitadel_sub]);

    return (
        <div>
            <UserSection user={user} />
            {!user && <p>Chargement...</p>}
            {user && !user?.membership && <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>Aucune adhésion trouvée</Typography>}
            {user && user?.membership && (
                <>
                    <div className="flex gap-x-20 flex-wrap">
                        <MembershipSection user={user} registerToMembershipUpdateForm={register} formControl={control} />
                        <ONTSection zitadel_sub={zitadel_sub} />
                        <BoxSection zitadel_sub={zitadel_sub} />
                    </div>
                    <div className="flex flex-wrap gap-x-20">
                        <AppointmentSection user={user} setUser={setUser} registerToMembershipUpdateForm={register} />
                        <InteropSection registerToMembershipUpdateForm={register} user={user} />
                        <ContractUpload zitadel_sub={zitadel_sub} />
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

export default UserComponent;
