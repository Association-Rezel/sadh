import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ONT, Status, Subscription, User as UserType } from "../../utils/types";
import { Api } from "../../utils/Api";
import { Button, Stack, TextField, Typography } from "@mui/material";

function User() {
    const { keycloak_id } = useParams<string>();

    return (
        <div className="card">
            <UserSection keycloak_id={keycloak_id} />
            <SubscriptionSection keycloak_id={keycloak_id} />
            <ONTSection keycloak_id={keycloak_id} />
        </div>
    );
};

function UserSection({ keycloak_id }: { keycloak_id: string }) {
    const [user, setUser] = useState<UserType>();

    useEffect(() => {
        Api.fetchUser(keycloak_id).then(user => {
            setUser(user);
        });
    }, [keycloak_id]);

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

function SubscriptionSection({ keycloak_id }: { keycloak_id: string }) {
    const [subscription, setSubscription] = useState<Subscription>();

    useEffect(() => {
        Api.fetchSubscription(keycloak_id).then(subscription => {
            setSubscription(subscription);
        });
    }, [keycloak_id]);

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

function ONTSection({ keycloak_id }: { keycloak_id: string }) {

    const [ont, setONT] = useState<ONT>();
    const [ontStillLoading, setONTStillLoading] = useState<boolean>(true);
    const [serial, setSerial] = useState<string>("");
    const [softwareVersion, setSoftwareVersion] = useState<string>("3FE45655AOCK88");

    const handleSubmit = () => {
        // serial is like ALCL:F887945B
        if (!serial || !serial.startsWith("ALCL:") || serial.length !== 13) {
            alert("Le numéro de série doit être de la forme ALCL:XXXXXXXX (13 chars)");
            return;
        }
        Api.registerONT(keycloak_id, serial, softwareVersion).then(ont => {
            setONT(ont);
        });
    }

    useEffect(() => {
        Api.fetchONT(keycloak_id).then(ont => {
            setONT(ont);
            setONTStillLoading(false);
        });
    }, [keycloak_id]);


    return (
        <>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                ONT
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {ontStillLoading && <p>Chargement...</p>}

                {!ontStillLoading && !ont && (
                    <form>
                        <Stack direction={"row"}
                            width={"50vw"}
                            spacing={2}>
                            <TextField name="serial_number"
                                required
                                label="Numéro de série"
                                variant="outlined"
                                onChange={(e) => setSerial(e.target.value)}
                            />
                            <TextField name="software_version"
                                required
                                label="Sofwtare version"
                                variant="outlined"
                                defaultValue={softwareVersion}
                                onChange={(e) => setSoftwareVersion(e.target.value)}
                            />
                            <Button variant="contained" onClick={handleSubmit}>Assigner l'ONT</Button>
                        </Stack>
                    </form>
                )}

                {!ontStillLoading && ont && (
                    <>
                        <strong>Numéro de série</strong> : {ont.serial_number}<br />
                        <strong>Position au PM</strong> : {ont.position_PM}<br />
                        <strong>Netbox ID</strong> : {ont.netbox_id}<br />
                    </>
                )}
            </Typography>
        </>
    )
}

export default User;
