import { useState, useEffect } from "react";
import { MembershipStatus, Residence, User } from "../../utils/types/types";
import { TableUsers } from "./TableUsers";
import { Api } from "../../utils/Api";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import { ResidencesFilter, StatusFilter, UserFilter, filterUsers } from "../../filters/UserFilters";
import { TextField } from "@mui/material";

function searchTextRecusively(user: User, searchText: string): boolean {
    if (!user) {
        return false;
    }

    return Object.keys(user).some((key) => {
        if (typeof user[key] === "object") {
            return searchTextRecusively(user[key], searchText);
        }
        return user[key].toString().toLowerCase().includes(searchText.toLowerCase());
    });
}


function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [searchText, setSearchText] = useState<string>("");

    useEffect(() => {
        Api.fetchUsers().then((users: User[]) => {
            setUsers(users);
        });
    }, []);

    const searchFilter: UserFilter = {
        filter(user: User): boolean {
            return searchTextRecusively(user, searchText);
        }
    };

    return (
        <div className="card">
            <h2>Users</h2>
            <TextField
                label="UNET ID, first name, last name, email, VIAxx, ref interne"
                variant="outlined"
                onChange={(event) => setSearchText(event.target.value)}
                value={searchText}
                fullWidth
                sx={{ marginBottom: 2 }}
            />
            <TableUsers users={filterUsers(users, Array.of(searchFilter))} rowsPerPageDefault={100} rowsPerPageOptions={[100, 500, 1000, { label: "All", value: -1 }]} />
        </div>
    );
};

export default Users;
