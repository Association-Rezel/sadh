import { useContext, useEffect } from "react";
import { OIDCContext } from "../../utils/OIDCContext";
import { AppStateContext } from "../../utils/AppStateContext";
import { Navigate } from "react-router-dom";


export default function LogoutPage() {
    const {resetAppState} = useContext(AppStateContext);
    const oidcAuth = useContext(OIDCContext);

    useEffect(() => {
        oidcAuth.signout();
        resetAppState();
    });

    return (
        <>
            <p>
                Vous allez être déconnecté...
            </p>
            <Navigate to="/" />
        </>
    );
}