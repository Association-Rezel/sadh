// Inspired by https://zitadel.com/docs/examples/login/react

import { useContext, useEffect } from "react";
import { User as ZitadelUser } from "oidc-client-ts";
import { AppStateContext } from "../../utils/AppStateContext";
import { ZitadelContext } from "../../utils/ZitadelContext";
import { Navigate } from "react-router-dom";
import { Config } from "../../utils/Config";

export default function LoginCallback() {
    const { appState, syncFromZitadelContext } = useContext(AppStateContext);
    const zitadelAuth = useContext(ZitadelContext);

    useEffect(() => {
        if (!appState.user) {
            zitadelAuth.userManager.signinRedirectCallback().then(() => {
                syncFromZitadelContext();
            });
        }
    }, []);

    if (appState.user) {
        return <Navigate to="/" />;
    } else {
        return <div>Logging in...</div>;
    }
};