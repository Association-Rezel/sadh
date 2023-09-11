import { useState, useEffect } from "react";
import { SubscriptionStatus, Residence, UserDataBundle } from "../../utils/types";
import { TableUsers } from "./TableUsers";
import { Api } from "../../utils/Api";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';
import { ResidencesFilter, StatusFilter, UserFilter, filterUsers } from "../../filters/UserFilters";

function Users() {
    const [users, setUsers] = useState<UserDataBundle[]>([]);
    const [filters, setFilters] = useState<UserFilter[]>([]);

    useEffect(() => {
        Api.fetchUserDataBundles().then((users: UserDataBundle[]) => {
            setUsers(users);
        });
    }, []);

    const handleResidenceChange = (residenceName: string) => {
        let newFilters = filters.filter((filter) => !(filter instanceof ResidencesFilter));
        let residence = Residence[residenceName];
        if (residence !== undefined) {
            newFilters.push(new ResidencesFilter(residence));
        }
        setFilters(newFilters);
    };

    const handleStatusChange = (statusName: string) => {
        let newFilters = filters.filter((filter) => !(filter instanceof StatusFilter));
        let status = SubscriptionStatus[statusName];
        if (status !== undefined) {
            newFilters.push(new StatusFilter(status));
        }
        setFilters(newFilters);
    };

    return (
        <div className="card">
            <h2>Users</h2>
            <FormGroup>
                <FormControl>
                    <InputLabel id="select-status-label">Statut</InputLabel>
                    <Select
                        labelId="select-status-label"
                        id="select-status"
                        label="Statut"
                        onChange={(e: any) => handleStatusChange(e.target.value)}
                        defaultValue=""
                    >
                        <MenuItem value="">Désélectionner</MenuItem>
                        {Object.values(SubscriptionStatus).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{SubscriptionStatus[key]}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl>
                    <InputLabel id="select-residence-label">Résidence</InputLabel>
                    <Select
                        labelId="select-residence-label"
                        id="select-residence"
                        label="Résidence"
                        onChange={(e: any) => handleResidenceChange(e.target.value)}
                        defaultValue=""
                    >
                        <MenuItem value="">Désélectionner</MenuItem>
                        {Object.values(Residence).map((key) => <MenuItem value={key} key={key}>{Residence[key]}</MenuItem>)}
                    </Select>
                </FormControl>
            </FormGroup>
            <TableUsers users={filterUsers(users, filters)} rowsPerPageDefault={100} />
        </div>
    );
};

export default Users;
