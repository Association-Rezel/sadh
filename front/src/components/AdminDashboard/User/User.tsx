import { useParams } from "react-router-dom";
import MembershipSection from "./MembershipSection";
import UserSection from "./UserSection";
import ONTSection from "./ONTSection";
import UnetSection from "./UnetSection";
import { useEffect, useState } from "react";
import { Api } from "../../../utils/Api";
import { Membership, MembershipType, User } from "../../../utils/types/types";
import { SubmitHandler, useForm } from "react-hook-form"
import AppointmentSection from "./AppointmentSection";
import InteropSection from "./InteropSection";
import { Button, Typography } from "@mui/material";
import StatusUpdateSection from "./StatusUpdateSection";
import { Box } from "../../../utils/types/hermes_types";
import { ONTInfo } from "../../../utils/types/pon_types";


function UserComponent() {
    const { user_id } = useParams<string>();
    const [user, setUser] = useState<User>(null);
    const [box, setBox] = useState<Box | null>(null);
    const [boxLoading, setBoxLoading] = useState<boolean>(true);
    const [ont, setONT] = useState<ONTInfo | null>(null);
    const [ontLoading, setONTLoading] = useState<boolean>(true);

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

        setBoxLoading(true);
        Api.fetchUserBox(user_id)
        .then(box => setBox(box))
        .finally(() => setBoxLoading(false));
    }, [user_id]);

    useEffect(() => {
        setONTLoading(true);
        Api.fetchONT(user_id)
        .then(ont => setONT(ont))
        .finally(() => setONTLoading(false));
    }, [box]);

    // Reste form when user changes. For example if the tstae is updaed
    // Via the status update section
    useEffect(() => {
        reset(user?.membership);
    }, [user]);

    return (
        <div>
            <UserSection user={user} />
            {!user && <p>Chargement...</p>}
            {user && !user?.membership && <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>Aucune adhésion trouvée</Typography>}
            {user && user?.membership && (
                <>
                    <div className="flex gap-x-20 flex-wrap justify-between">
                        <MembershipSection user={user} setUser={setUser} registerToMembershipUpdateForm={register} formControl={control} />
                        <StatusUpdateSection user={user} setUser={setUser} />
                        <UnetSection user={user} box={box} setBox={setBox} ont={ont} boxLoading={boxLoading} setBoxLoading={setBoxLoading} />
                        {user.membership.type === MembershipType.FTTH && (
                            <>
                                <AppointmentSection user={user} setUser={setUser} registerToMembershipUpdateForm={register} />
                                <ONTSection user_id={user_id} box={box} ont={ont} setONT={setONT} ontLoading={ontLoading} setONTLoading={setONTLoading} />
                                <InteropSection registerToMembershipUpdateForm={register} user={user} />
                            </>
                        )}
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
