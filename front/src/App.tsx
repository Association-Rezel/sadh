import './App.css'
import {BrowserRouter, Routes, Route, Outlet, Link} from "react-router-dom";
import {Button} from "@mui/material";

function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="admin" element={<Admin />} />
                <Route path="abonne" element={<Abonne />} />
            </Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App

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
                <Link to="/abonne">Espace abonné</Link>
            </Button>

            <Outlet/>
        </>
    )
}

function Home() {
    return (
        <h1>Home</h1>
    )
}

function Admin() {
    return (
        <h1>Admin</h1>
    )
}
function Abonne() {
    return (
        <h1>Espace abonné</h1>
    )
}