import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageAdmin } from "./pages/admin/PageAdmin";
import Index from "./pages/index";
import BecomeMember from "./components/MembershipRequest/BecomeMember";
import "./App.css";
import Page404 from "./components/Page404";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AccountDashboard from "./components/AccountDashboard/AccountDashboard";
import Users from "./components/Users/Users";
import CalendarComponent from "./components/Calendar/Calendar";
import { AppState, AppStateContext, AppStateWrapper } from "./utils/AppStateContext";
import { useContext } from "react";
import UserComponent from "./components/AdminDashboard/User/User";
import { MembershipStatus, MembershipType } from "./utils/types/types";
import PageAppointment from "./pages/appointment/PageAppointment";
import PageSettings from "./pages/account/PageNetworkSettings";
import LoginPage from "./pages/auth/LoginPage";
import { ZitadelContextWrapper } from "./utils/ZitadelContext";
import LoginCallback from "./pages/auth/LoginCallback";
import LogoutPage from "./pages/auth/LogoutPage";
import { CircularProgress } from "@mui/material";
import OLTDebug from "./components/AdminDashboard/Debug/OLTDebug";
import IpamLogs from "./components/AdminDashboard/Logs/IpamLogs";
import PageNetworkSettings from "./pages/account/PageNetworkSettings";
import PartialRefunds from "./components/PartialRefunds/PartialRefunds";

function AppRouter() {
    const { appState } = useContext(AppStateContext);

    if (!appState.loaded) {
        return <div className="flex justify-center items-center h-screen">
            <CircularProgress />
        </div>
    }

    return <BrowserRouter>
        <Routes>
            <Route path="/">
                <Route index element={<Index />} />
                <Route path="login" Component={LoginPage} />
                <Route path="logout" Component={LogoutPage} />
                <Route path="loginCallback" Component={LoginCallback} />
                <Route path="adherer/*" Component={appState.user ? BecomeMember : LoginPage} />
                <Route path="signup" Component={LoginPage} />

                {accountRoute({ appState })}

                {appState.user && appState.admin && (
                    <Route path="admin" element={<AdminDashboard />}>
                        <Route index Component={PageAdmin} />
                        <Route path="calendar" Component={CalendarComponent} />
                        <Route path="users" Component={Users} />
                        <Route path="users/:user_id" Component={UserComponent} />
                        <Route path="olt-debug" Component={OLTDebug} />
                        <Route path="logs-ipam" Component={IpamLogs} />
                        <Route path="partial-refunds" Component={PartialRefunds} />
                    </Route>
                )}

                <Route path="appointment" element={<Navigate to="/account/appointment" />} />
                <Route path="*" Component={Page404} />
            </Route>
        </Routes>
    </BrowserRouter>
}

function App() {
    return (
        <ZitadelContextWrapper>
            <AppStateWrapper>
                <AppRouter />
            </AppStateWrapper>
        </ZitadelContextWrapper>

    );
}

function accountRoute({ appState }: { appState: AppState }) {
    const appointmentRoute = (
        <Route path="appointment" Component={PageAppointment} />
    );
    const networkSettingsRoute = (
        <Route path="network" element={<PageNetworkSettings />} />
    );
    const bankSettingsRoute = (
        <Route path="bank-settings" element={<PageNetworkSettings />} />
    );

    if (!appState.user) {
        return <Route path="account" element={<Navigate to="/login" />} />
    }
    else if ([MembershipStatus.ACTIVE, MembershipStatus.PENDING_INACTIVE].includes(appState.user.membership?.status)) {
        if (appState.user.membership?.type == MembershipType.FTTH) {
            if (appState.user.membership?.unetid) {
                return (
                    <Route path="account" element={<AccountDashboard appState={appState} />}>
                        {appointmentRoute}
                        {networkSettingsRoute}
                        {bankSettingsRoute}
                    </Route>
                )
            } else {
                return (
                    <Route path="account" element={<AccountDashboard appState={appState} />}>
                        {appointmentRoute}
                    </Route>
                )
            }
        } else { // WIFI
            return (
                <Route path="account" element={<AccountDashboard appState={appState} />}>
                    {networkSettingsRoute}
                </Route>
            )
        }
    }

    else if (appState.user?.membership?.status == MembershipStatus.REQUEST_PENDING_VALIDATION) {
        return <Route path="account" element={<Navigate to="/adherer" />} />
    }

    else {
        return <Route path="account" element={<Navigate to="/login" />} />
    }
}

export default App;
