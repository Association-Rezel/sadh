import {BrowserRouter, Routes, Route, Outlet, Link} from "react-router-dom";
import {Button} from "@mui/material";

import {PageAdmin} from "./pages/PageAdmin";
import {PageAdherent} from "./pages/PageAdherent";
import {PageAccueil} from "./pages/PageAccueil";

import './App.css'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<PageAccueil />} />
                    <Route path="admin" element={<PageAdmin />} />
                    <Route path="adherents" element={<PageAdherent />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

function Layout() {
    return (
        <>
            <Button variant="outlined">
                <Link to="/">Home</Link>
            </Button>
            <Button variant="outlined">
                <Link to="/admin">Admin</Link>
            </Button>
            <Button variant="outlined">
                <Link to="/adherents">Espace adhérents</Link>
            </Button>

            <Outlet/>
        </>
    )
}







export default App
