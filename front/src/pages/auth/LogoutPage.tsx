import { useContext, useEffect } from "react";
import { ZitadelContext } from "../../utils/ZitadelContext";
import { AppStateContext } from "../../utils/AppStateContext";
import { Navigate } from "react-router-dom";


export default function LogoutPage() {
    const {resetAppState} = useContext(AppStateContext);
    const zitadelAuth = useContext(ZitadelContext);

    useEffect(() => {
        zitadelAuth.signout();
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