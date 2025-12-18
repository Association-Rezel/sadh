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
import UserComponent from "./components/AdminDashboard/User/User";
import { MembershipStatus, MembershipType } from "./utils/types/types";
import PageAppointment from "./pages/appointment/PageAppointment";
import { CircularProgress } from "@mui/material";
import OLTDebug from "./components/AdminDashboard/Debug/OLTDebug";
import IpamLogs from "./components/AdminDashboard/Logs/IpamLogs";
import PageNetworkSettings from "./pages/account/PageNetworkSettings";
import PartialRefunds from "./components/PartialRefunds/PartialRefunds";
import ScholarshipStudent from "./components/ScholarshipStudent/ScholarshipStudent";
import { ToastContainer } from "react-toastify";
import AuthCallbackErrorPage from "./pages/auth/AuthCallbackErrorPage";
import { AuthProvider, useAuthContext } from "./pages/auth/AuthContext";
import LoginOrSignupPage from "./pages/auth/LoginOrSignupPage";
import { AdminLoginRedirect, LoginRedirect } from "./pages/auth/AuthRedirect";
import PtahImageDownloader from "./components/AdminDashboard/Ptah/Ptah";

function AppRouter() {
    const { user, admin, isLoading } = useAuthContext();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <CircularProgress />
        </div>;
    }

    return <BrowserRouter>
        <Routes>
            <Route path="/">
                <Route index element={<Index />} />
                <Route path="login/auth-error" element={<AuthCallbackErrorPage />} />
                <Route path="adherer/*" Component={user ? BecomeMember : LoginOrSignupPage} />
                {accountRoute({ user })}

                {admin ? (
                    <Route path="admin" element={<AdminDashboard />}>
                        <Route index Component={PageAdmin} />
                        <Route path="calendar" Component={CalendarComponent} />
                        <Route path="users" Component={Users} />
                        <Route path="users/:user_id" Component={UserComponent} />
                        <Route path="olt-debug" Component={OLTDebug} />
                        <Route path="logs-ipam" Component={IpamLogs} />
                        <Route path="partial-refunds" Component={PartialRefunds} />
                        <Route path="scholarship-student" Component={ScholarshipStudent} />
                        <Route path="ptah-images" Component={PtahImageDownloader} />
                    </Route>
                ): (
                    <Route path="admin/*" element={<AdminLoginRedirect />} />
                )}

                <Route path="appointment" element={<Navigate to="/account/appointment" />} />
                <Route path="*" Component={Page404} />
            </Route>
        </Routes>
        <ToastContainer
            autoClose={3000}
            position='top-right'
            pauseOnFocusLoss={false}
            hideProgressBar
        />
    </BrowserRouter>
}

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>

    );
}

function accountRoute({ user }: { user?: any } = {}) {
    const appointmentRoute = (
        <Route path="appointment" Component={PageAppointment} />
    );
    const networkSettingsRoute = (
        <Route path="network" element={<PageNetworkSettings />} />
    );
    const bankSettingsRoute = (
        <Route path="bank-settings" element={<PageNetworkSettings />} />
    );

    if (!user) {
        return <Route path="account" element={<LoginRedirect/>} />
    }
    else if ([MembershipStatus.ACTIVE, MembershipStatus.PENDING_INACTIVE].includes(user.membership?.status)) {
        if (user.membership?.type == MembershipType.FTTH) {
            if (user.membership?.unetid) {
                return (
                    <Route path="account" element={<AccountDashboard />}>
                        {appointmentRoute}
                        {networkSettingsRoute}
                        {bankSettingsRoute}
                    </Route>
                )
            } else {
                return (
                    <Route path="account" element={<AccountDashboard />}>
                        {appointmentRoute}
                    </Route>
                )
            }
        } else { // WIFI
            return (
                <Route path="account" element={<AccountDashboard />}>
                    {networkSettingsRoute}
                </Route>
            )
        }
    }

    else if (user?.membership?.status == MembershipStatus.REQUEST_PENDING_VALIDATION) {
        return <Route path="account" element={<Navigate to="/adherer" />} />
    }

    else {
        return <Route path="account" element={<LoginRedirect />} />
    }
}

export default App;
