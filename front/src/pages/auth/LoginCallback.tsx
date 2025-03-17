import { useContext, useEffect } from "react";
import { AppStateContext } from "../../utils/AppStateContext";
import { OIDCContext } from "../../utils/OIDCContext";
import { Navigate } from "react-router-dom";

export default function LoginCallback() {
    const { appState, syncFromOIDCContext } = useContext(AppStateContext);
    const oidcAuth = useContext(OIDCContext);

    useEffect(() => {
        if (!appState.user && oidcAuth) {
            oidcAuth.userManager.signinRedirectCallback().then(() => {
                syncFromOIDCContext?.();
            }).catch((err) => {
                console.error("Erreur lors du callback OIDC:", err);
            });
        }
    }, [appState.user, oidcAuth, syncFromOIDCContext]);

    if (appState.user) {
        return <Navigate to="/" />;
    } else {
        return <div>Logging in...</div>;
    }
}