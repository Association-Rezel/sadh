import React, {useContext} from "react";
import {AppStateContext} from "../../utils/AppState";

export function PageAdmin() {
    const appState = useContext(AppStateContext);

    return (
        <div>
            <h1>Admin</h1>
            {JSON.stringify(appState)}
            <p> NB : Il faut lancer le backend sur localhost:8000 pour faire marcher ce code.</p>
        </div>
    );
}
