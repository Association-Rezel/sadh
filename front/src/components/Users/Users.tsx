import { useState, useEffect } from "react";
import { User } from "../../utils/types";
import { TableUsers } from "./TableUsers";
import { Api } from "../../utils/Api";
import { SearchBar } from "./SearchBar";

let residenceSelected = "";
let searchSelected = "";

const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [usersFiltered, setUsersFiltered] = useState<User[]>([]);

    const onSearch = (search: string) => {
        searchSelected = search;
        updateUsers();
    };

    const changeResidence = (residence: string) => {
        residenceSelected = residence;
        updateUsers();
    };

    const updateUsers = () => {
        const newUsersFiltered = users
            .filter((oneUser) => oneUser.residence === residenceSelected || residenceSelected === "")
            .filter(
                (oneUser) => oneUser.name.toLowerCase().includes(searchSelected.toLowerCase()) || searchSelected === ""
            );
        setUsersFiltered(newUsersFiltered);
    };

    useEffect(() => {
        Api.fetchUsers().then((users) => {
            setUsers(users);
            setUsersFiltered(users);
        });
    }, []);

    return (
        <div className="card">
            <h2>Users</h2>
            <SearchBar onSearch={onSearch} changeResidence={changeResidence} />
            <TableUsers rows={usersFiltered} />
        </div>
    );
};

export default Users;
