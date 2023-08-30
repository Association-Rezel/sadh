import { useEffect, useState } from "react";
import { User as UserType } from "../../../utils/types";
import { Api } from "../../../utils/Api";
import { Typography } from "@mui/material";

export default function UserSection({ keycloak_id }: { keycloak_id: string }) {
    const [user, setUser] = useState<UserType>();

    useEffect(() => {
        Api.fetchUser(keycloak_id).then(user => {
            setUser(user);
        });
    }, [keycloak_id]);

    if (!user) return (<>Chargement...</>);

    return (
        <div>
            <Typography variant="h3" align="center" color="text.primary" component="div" sx={{ marginTop: 3 }}>
                Adhérent : {user.name}
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>{user.email}</strong>
            </Typography>
        </div>
    )
}