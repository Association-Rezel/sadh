import {BrowserRouter, Route, Routes} from "react-router-dom";
import {PageAdmin} from "./pages/admin/PageAdmin";
import {PageAccueil} from "./pages/account/PageAccueil";
import DHCP from "./components/DHCP/DHCP";
import { PageBoxe } from "./pages/account/PageBoxe";
import Orders from "./components/Orders/Orders";
import Index from "./pages/index";

import "./App.css";
import Page404 from "./components/Page404";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AccountDashboard from "./components/AccountDashboard/AccountDashboard";
import Users from "./components/Users/Users";
import ConnectedDevices from "./components/ConnectedDevices/ConnectedDevices";
import {AppStateContext, AppStateWrapper} from "./utils/AppState";
import {useContext} from "react";

function AppRouter() {
    const appState = useContext(AppStateContext);
    return <BrowserRouter>
    <Routes>
        <Route path="/">
            <Route index element={<Index />} />
            {appState.logged && (
                <Route path="account" element={<AccountDashboard />}>
                    <Route index Component={PageAccueil} />
                    <Route path="orders" Component={Orders} />
                    <Route path="devices" Component={ConnectedDevices} />
                    <Route path="DHCP" Component={DHCP} />
                    <Route path="boxe" Component={PageBoxe} />
                </Route>
            )}
            {appState.logged && appState.user?.isAdmin && (
                <Route path="admin" element={<AdminDashboard />}>
                    <Route index Component={PageAdmin} />
                    <Route path="users" Component={Users} />
                </Route>
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
