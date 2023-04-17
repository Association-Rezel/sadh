import { useState, useEffect } from 'react';
import {BrowserRouter, Routes, Route, Outlet, Link} from "react-router-dom";
import {Button} from "@mui/material";

import './App.css'
import TestTable from "./TestTable";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="abonne" element={<Abonne />} />
                    <Route path="test_tables" element={<TestTable />} />
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
                <Link to="/abonne">Espace abonné</Link>
            </Button>
            <Button variant="outlined">
                <Link to="/test_tables">Test Tables</Link>
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

    const [users, setUsers] = useState([])
    const fetchUsers = async () => {
        const response = await fetch("http://localhost:8000/users")
        const users = await response.json()
        console.log(users)
        setUsers(users)
    }

    useEffect(()=>{
        fetchUsers()
    },[])



    return (
        <div>
            <h1>Admin</h1>
            <p> NB : Il faut lancer le backend sur localhost:8000 pour faire marcher ce code.</p>

            <div className="card">
                <h2>Users</h2>
                {
                    users && users.length>0 && users.map((item:any)=><p>{item.id}</p>)
                }

            </div>

        </div>
    )
}
function Abonne() {
    return (
        <h1>Espace abonné</h1>
    )
}


export default App
