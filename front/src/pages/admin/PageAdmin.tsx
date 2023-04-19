import React, { useEffect, useState } from "react";

import { Api } from "../../utils/Api";
import { User } from "../../utils/types";
import { useUser } from "../../utils/hooks";
import AdminDashboard from "../../components/AdminDashboard/AdminDashboard";

export function PageAdmin() {
    const user = useUser();

    return (
        <div>
            <h1>Admin</h1>
            {JSON.stringify(user)}
            <p> NB : Il faut lancer le backend sur localhost:8000 pour faire marcher ce code.</p>
        </div>
    );
}
