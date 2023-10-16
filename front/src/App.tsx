import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageAdmin } from "./pages/admin/PageAdmin";
import { PageContract } from "./pages/contract/PageContract";
import Index from "./pages/index";
import Subscribe from "./components/Subscription/Subscribe";
import "./App.css";
import Page404 from "./components/Page404";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AccountDashboard from "./components/AccountDashboard/AccountDashboard";
import Users from "./components/Users/Users";
import CalendarComponent from "./components/Calendar/Calendar";
import { AppStateContext, AppStateWrapper } from "./utils/AppState";
import { useContext } from "react";
import User from "./components/AdminDashboard/User/User";
import { SubscriptionStatus } from "./utils/types";
import PageAppointment from "./pages/appointment/PageAppointment";
import WaitAppointment from "./pages/appointment/WaitAppointment";
import NoAppointment from "./pages/appointment/NoAppointment";
import LoginPage from "./components/LoginPage";

function AppRouter() {
    const appState = useContext(AppStateContext);
    console.log("appState", appState)

    const appointementSelection = () => {
        if (appState.subscription?.status === SubscriptionStatus.PENDING_VALIDATION) {
            return <Route path="appointment" Component={WaitAppointment} />
        } 
        if (appState.subscription?.status === SubscriptionStatus.VALIDATED) {
            return <Route path="appointment" Component={PageAppointment} />
        }
        return <Route path="appointment" Component={NoAppointment} />
    }

    return <BrowserRouter>
        <Routes>
            <Route path="/">
                <Route index element={<Index />} />
                <Route path="subscribe" element={
                    (appState.logged || /.*state=.*&session_state=.*&code=.*/.test(window.location.href)) ? <Subscribe /> : <Navigate to="/" />
                } />
                {appState.logged ? (
                    <Route path="account" element={<AccountDashboard />}>
                        {appointementSelection()}
                        {/*
                        <Route index Component={PageAccueil} />
                        <Route path="orders" Component={Orders} />
                        <Route path="devices" Component={ConnectedDevices} />
                        <Route path="DHCP" Component={DHCP} />
                        <Route path="ports" Component={Ports} />
                        */}
                    </Route>
                ) : (
                    <Route path="account/*" element={<LoginPage />} />
                )}
                {appState.logged && appState.user?.is_admin && (
                    <Route path="admin" element={<AdminDashboard />}>
                        <Route index Component={PageAdmin} />
                        <Route path="calendar" Component={CalendarComponent} />
                        <Route path="users" Component={Users} />
                        <Route path="users/:keycloak_id" Component={User} />
                    </Route>
                )}

                <Route path="appointment" element={<Navigate to="/account/appointment" />} />

                {appState.logged && appState.subscription?.status != SubscriptionStatus.PENDING_VALIDATION && appState.subscription?.status != SubscriptionStatus.REJECTED && (
                    <Route path="contract" Component={PageContract} />
                )}
                <Route path="*" Component={Page404} />
            </Route>
        </Routes>
    </BrowserRouter>
}

function App() {
    return (
        <AppStateWrapper>
            <AppRouter />
        </AppStateWrapper>
    );
}

export default App;
