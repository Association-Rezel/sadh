import {useContext} from "react";
import {AppStateContext} from "../../utils/AppStateContext";
import Dashboards from "../../components/AdminDashboard/Dashboard/Dashboards";

export function PageAdmin() {
    const appState = useContext(AppStateContext);
    return (
        <div>
            <h1>Dashboards Admin</h1>
            <Dashboards />
        </div>
    );
}
