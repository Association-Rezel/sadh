import {BrowserRouter, Outlet, Route, Routes} from "react-router-dom";

import {PageAdmin} from "./pages/PageAdmin";
import {PageAdherent} from "./pages/PageAdherent";
import {PageAccueil} from "./pages/PageAccueil";

import './App.css'
import {MenuBar} from "./components/MenuBar";
import * as React from "react";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout/>}>
                    <Route index element={<PageAccueil/>}/>
                    <Route path="admin" element={<PageAdmin/>}/>
                    <Route path="adherents" element={<PageAdherent/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

function Layout() {
    return (
        <>
            <MenuBar pages={[
                {titre: "Accueil", route: "/"},
                {titre: "Espace adhérents", route: "/adherents"},
                {titre: "Espace Administrateurs", route: "/admin"},
            ]}/>

            <Outlet/>
        </>
    )
}

export default App;


