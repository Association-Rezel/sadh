import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ONT, Status, Subscription, User as UserType } from "../../utils/types";
import { Api } from "../../utils/Api";
import { Typography } from "@mui/material";

function User() {
    let { keycloak_id } = useParams();

    const [user, setUser] = useState<UserType>();
    const [ont, setONT] = useState<ONT>();
    const [subscription, setSubscription] = useState<Subscription>();

    useEffect(() => {
        Api.fetchUser(keycloak_id).then(user => {
            setUser(user);
        });

        Api.fetchONT(keycloak_id).then(ont => {
            setONT(ont);
        });

        Api.fetchSubscription(keycloak_id).then(subscription => {
            setSubscription(subscription);
        });
    }, [keycloak_id]);

    return (
        <div className="card">
            <UserSection user={user} />
            <SubscriptionSection subscription={subscription} />
            <ONTSection ont={ont} />
        </div>
    );
};

function UserSection({ user }: { user: UserType }) {
    if (!user) return (<></>);

    return (
        <>
            <Typography variant="h3" align="center" color="text.primary" component="div" sx={{ marginTop: 3 }}>
                Adhérent : {user.name}
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>{user.email}</strong>
            </Typography>
        </>
    )
}

function SubscriptionSection({ subscription }: { subscription: Subscription }) {
    if (!subscription) return (<></>);

    return (
        <>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Adhésion <Typography fontSize={10}>{subscription.subscription_id}</Typography>
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Statut</strong> : {Status[subscription.status]}<br />
                <strong>Chambre</strong> : {subscription.chambre.name} - {subscription.chambre.residence}<br />
            </Typography>
        </>
    )
}

function ONTSection({ ont }: { ont: ONT }) {
    if (!ont) return (<></>);

    return (
        <>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                ONT
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Numéro de série</strong> : {ont.serial_number}<br />
                <strong>Position au PM</strong> : {ont.position_PM}<br />
            </Typography>
        </>
    )
}

export default User;
