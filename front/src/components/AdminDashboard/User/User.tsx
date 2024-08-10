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
import { Button, Typography } from "@mui/material";
import ContractUpload from "./ContractUpload";


function UserComponent() {
    const { user_id } = useParams<string>();
    const [user, setUser] = useState<User>(null);
    const { register, handleSubmit, reset, formState, control } = useForm({
        defaultValues: user?.membership
    });

    const onSubmit: SubmitHandler<Membership> = (membership: Membership) => {
        Api.updateMembership(user.id, membership)
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
        Api.fetchUser(user_id).then((user: User) => {
            setUser(user);
            reset(user.membership);
        });
    }, [user_id]);

    return (
        <div>
            <UserSection user={user} />
            {!user && <p>Chargement...</p>}
            {user && !user?.membership && <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>Aucune adhésion trouvée</Typography>}
            {user && user?.membership && (
                <>
                    <div className="flex gap-x-20 flex-wrap justify-between">
                        <MembershipSection user={user} registerToMembershipUpdateForm={register} formControl={control} />
                        <ONTSection user_id={user_id} />
                        <BoxSection user_id={user_id} />
                    </div>
                    <div className="flex flex-wrap gap-x-20 justify-between">
                        <AppointmentSection user={user} setUser={setUser} registerToMembershipUpdateForm={register} />
                        <InteropSection registerToMembershipUpdateForm={register} user={user} />
                        <ContractUpload user_id={user_id} />
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
