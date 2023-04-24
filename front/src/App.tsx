import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PageAdmin } from "./pages/admin/PageAdmin";
import { PageAccueil } from "./pages/account/PageAccueil";
import { PageBoxe } from "./pages/account/PageBoxe";
import Index from "./pages/index";

import "./App.css";
import { useUser } from "./utils/hooks";
import Page404 from "./components/Page404";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import Users from "./components/Users/Users";
import AccountDashboard from "./components/AccountDashboard/AccountDashboard";

function App() {
  const user = useUser();
  console.log(user);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Index />} />
          {user && (
            <Route path="account" element={<AccountDashboard />}>
              <Route index Component={PageAccueil} />
              <Route path="boxe" Component={PageBoxe} />
            </Route>
          )}
          {user && user.isAdmin && (
            <Route path="admin" element={<AdminDashboard />}>
              <Route index Component={PageAdmin} />
              <Route path="users" Component={Users} />
            </Route>
          )}
          <Route path="*" Component={Page404} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
