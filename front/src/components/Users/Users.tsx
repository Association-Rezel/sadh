import { useState, useEffect } from "react";
import { User } from "../../utils/types";
import { TableUsers } from "./TableUsers";
import { Api } from "../../utils/Api";

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        Api.fetchUsers().then((users) => setUsers(users));
    }, []);

    return (
        <div className="card">
            <h2>Users</h2>
            <TableUsers rows={users} />
        </div>
    );
};

export default Users;
