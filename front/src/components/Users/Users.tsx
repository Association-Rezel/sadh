import { useState, useEffect } from "react";
import { User } from "../../utils/types";
import UsersTable from "./UsersTable";
import { Api } from "../../utils/Api";

const Users = () => {
    const [users, setUsers] = useState([] as User[]);

    useEffect(() => {
        Api.fetchUsers().then((users) => setUsers(users));
    }, []);

    return (
        <div className="card">
            <h2>Users</h2>
            <UsersTable data={users} />
        </div>
    );
};

export default Users;
