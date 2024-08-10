import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PageAdmin } from "./pages/admin/PageAdmin";
import { PageContract } from "./pages/contract/PageContract";
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
import { MembershipStatus } from "./utils/types/types";
import PageAppointment from "./pages/appointment/PageAppointment";
import { LoginPage, RegisterPage } from "./pages/auth/LoginPage";
import { ZitadelContextWrapper } from "./utils/ZitadelContext";
import LoginCallback from "./pages/auth/LoginCallback";
import LogoutPage from "./pages/auth/LogoutPage";
import { CircularProgress } from "@mui/material";

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
                <Route path="adherer" Component={appState.user ? BecomeMember : RegisterPage} />

                {accountRoute({ appState })}

                {appState.user && appState.admin && (
                    <Route path="admin" element={<AdminDashboard />}>
                        <Route index Component={PageAdmin} />
                        <Route path="calendar" Component={CalendarComponent} />
                        <Route path="users" Component={Users} />
                        <Route path="users/:user_id" Component={UserComponent} />
                    </Route>
                )}

                <Route path="appointment" element={<Navigate to="/account/appointment" />} />

                {appState.user && appState.user?.membership?.status != MembershipStatus.REQUEST_PENDING_VALIDATION && appState.user?.membership?.status != MembershipStatus.REJECTED && (
                    <Route path="contract" Component={PageContract} />
                )}
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
    if (!appState.user) {
        return <Route path="account" element={<Navigate to="/login" />} />
    }

    else if ([MembershipStatus.ACTIVE, MembershipStatus.PENDING_INACTIVE].includes(appState.user.membership?.status)) {
        return (
            <Route path="account" element={<AccountDashboard />}>
                <Route path="appointment" Component={PageAppointment} />
                {/*
                        <Route index Component={PageAccueil} />
                        <Route path="orders" Component={Orders} />
                        <Route path="devices" Component={ConnectedDevices} />
                        <Route path="DHCP" Component={DHCP} />
                        <Route path="ports" Component={Ports} />
                        */}
            </Route>
        )
    }

    else if (appState.user?.membership?.status == MembershipStatus.REQUEST_PENDING_VALIDATION) {
        return <Route path="account" element={<Navigate to="/adherer" />} />
    }

    else {
        return <Route path="account" element={<Navigate to="/login" />} />
    }
}

export default App;
