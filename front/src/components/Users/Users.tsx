import { useState, useEffect } from "react";
import { User, Status, Residence, Subscription } from "../../utils/types";
import { TableUsers } from "./TableUsers";
import { Api } from "../../utils/Api";
import { SearchBar } from "./SearchBar";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormGroup from '@mui/material/FormGroup';

let residenceSelected = "";
let statusSelected = "";

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [usersFiltered, setUsersFiltered] = useState<User[]>([]);
    useEffect(() => {
        Api.fetchSubscriptions().then((subscriptions) => {
            setSubscriptions(subscriptions);
        });
    });

    const changeStatus = (status: string) => {
        statusSelected = status;
        updateFilter();
    };

    const changeResidence = (residence: string) => {
        residenceSelected = residence;
        updateFilter();
    };

    const handleResidenceChange = (e) => {
        let residence = e.target.value;
        changeResidence(residence);
    };

    const handleStatusChange = (e) => {
        let status = e.target.value;
        changeStatus(status);
    };

    const updateFilter = () => {        
        let user_expanded: any[] = users;
        for (let ukey in user_expanded) {
            let user_subscription = subscriptions.filter((subscription) => subscription.user_id === users[ukey].keycloak_id);
            if (user_subscription.length > 0) {
                user_expanded[ukey].subscription = user_subscription[0];
            }
        }
        console.log(residenceSelected)
        if (residenceSelected) {
            console.log("La rédidence est set")
            user_expanded = user_expanded.filter((user) => "subscription" in user ? (user.subscription.chambre.residence == residenceSelected) : false);
        }
        if (statusSelected) {
            user_expanded = user_expanded.filter((user) => "subscription" in user ? user.subscription.status == statusSelected : false);
        }

        let user_filtered: User[] = [];
        for (let ukey in user_expanded) {
            let u = user_expanded[ukey];
            delete u.subscription;
            user_filtered[ukey] = user_expanded[ukey];
        }

        setUsersFiltered(user_expanded);

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
            <FormGroup>
                <FormControl>
                    <InputLabel id="select-status-label">Statut</InputLabel>
                    <Select
                        labelId="select-status-label"
                        id="select-status"
                        label="Statut"
                        onChange={handleStatusChange}
                    >
                        <MenuItem value="">Désélectionner</MenuItem>
                        {Object.values(Status).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{Status[key]}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl>
                    <InputLabel id="select-residence-label">Résidence</InputLabel>
                    <Select
                        labelId="select-residence-label"
                        id="select-residence"
                        label="Résidence"
                        onChange={handleResidenceChange}
                    >
                        <MenuItem value="">Désélectionner</MenuItem>
                        {Object.values(Residence).map((key) => <MenuItem value={key} key={key}>{Residence[key]}</MenuItem>)}
                    </Select>
                </FormControl>
            </FormGroup>
            <TableUsers rows={usersFiltered} />
        </div>
    );
};

export default Users;
