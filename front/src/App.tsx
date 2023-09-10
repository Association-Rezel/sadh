import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {PageAdmin} from "./pages/admin/PageAdmin";
import {PageAccueil} from "./pages/account/PageAccueil";
import DHCP from "./components/DHCP/DHCP";
import BoxConfig from "./components/Box/BoxConfig";
import Orders from "./components/Orders/Orders";
import Index from "./pages/index";
import {Ports} from "./components/Ports/Ports";
import Subscribe from "./components/Subscription/Subscribe";

import "./App.css";
import Page404 from "./components/Page404";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AccountDashboard from "./components/AccountDashboard/AccountDashboard";
import Users from "./components/Users/Users";
import CalendarComponent from "./components/Calendar/Calendar";
import ConnectedDevices from "./components/ConnectedDevices/ConnectedDevices";
import {AppStateContext, AppStateWrapper} from "./utils/AppState";
import {useContext} from "react";
import User from "./components/AdminDashboard/User/User";
import { Status } from "./utils/types";
import PageAppointment from "./pages/appointment/PageAppointment";

function AppRouter() {
    const appState = useContext(AppStateContext);
    console.log("appState", appState)
    return <BrowserRouter>
    <Routes>
        <Route path="/">
            <Route index element={<Index />} />
            <Route path="subscribe" element={
                (appState.logged || /.*state=.*&session_state=.*&code=.*/.test(window.location.href)) ? <Subscribe /> : <Navigate to="/" />
            } />
            {appState.logged && false && (
                <Route path="account" element={<AccountDashboard />}>
                    <Route index Component={PageAccueil} />
                    <Route path="orders" Component={Orders} />
                    <Route path="devices" Component={ConnectedDevices} />
                    <Route path="DHCP" Component={DHCP} />
                    <Route path="box" Component={BoxConfig} />
                    <Route path="ports" Component={Ports} />
                </Route>
            )}
            {appState.logged && appState.user?.is_admin && (
                <Route path="admin" element={<AdminDashboard />}>
                    <Route index Component={PageAdmin} />
                    <Route path="calendar" Component={CalendarComponent} />
                    <Route path="users" Component={Users} />
                    <Route path="users/:keycloak_id" Component={User} />
                </Route>
            )}
            {appState.logged && appState.subscription?.status === Status.VALIDATED && (
                <Route path="appointment" Component={PageAppointment} />
            )}
            <Route path="*" Component={Page404} />
        </Route>
    </Routes>
</BrowserRouter>
}

function App() {
    return (
        <AppStateWrapper>
            <AppRouter/>
        </AppStateWrapper>
    );
}

export default App;
