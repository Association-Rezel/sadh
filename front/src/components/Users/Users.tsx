import { useState, useEffect } from "react";
import { MembershipType, User } from "../../utils/types/types";
import { TableUsers } from "./TableUsers";
import Api from "../../utils/Api";
import { UserFilter, filterUsers } from "../../filters/UserFilters";
import { TextField } from "@mui/material";
import { Box } from "../../utils/types/hermes_types";
import { ONTInfo, RawDBONT } from "../../utils/types/pon_types";

function searchTextRecusively(object: object, searchText: string): boolean {
    if (!object) {
        return false;
    }

    return Object.keys(object).some((key) => {
        if (typeof object[key] === "object") {
            return searchTextRecusively(object[key], searchText);
        }
        return object[key].toString().toLowerCase().includes(searchText.toLowerCase());
    });
}

type EnrichedSearchableUser = User & { box: Box | null, ont: RawDBONT | null };

export default function Users() {
    const [users, setUsers] = useState<EnrichedSearchableUser[]>([]);
    const [boxes, setBoxes] = useState<Box[]>([]);
    const [onts, setONTs] = useState<RawDBONT[]>([]);
    const [searchText, setSearchText] = useState<string>("");

    if (users.length > 0 && boxes.length > 0 && onts.length > 0) {
        users.forEach((user) => {
            if (user.membership && user.membership.unetid) {
                boxes.forEach((box) => {
                    if (box.unets.map((unet) => unet.unet_id).includes(user.membership.unetid)) {
                        user.box = box;
                    }
                });
            }
            if (user.membership && user.membership.type === MembershipType.FTTH && user.box) {
                onts.forEach((ont) => {
                    if (ont.box_mac_address === user.box.mac) {
                        user.ont = ont;
                    }
                });
            }
        });
    }

    useEffect(() => {
        Api.fetchUsers().then((users: User[]) => {
            setUsers(users.map((user) => ({ ...user, box: null, ont: null })));
        });
        Api.fetchBoxes().then((boxes: Box[]) => {
            setBoxes(boxes);
        });
        Api.fetchONTs().then((onts: RawDBONT[]) => {
            setONTs(onts);
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
                label="Chercher n'importe quel champ utilisateur/box/ONT (hors position ONT)"
                variant="outlined"
                onChange={(event) => setSearchText(event.target.value)}
                value={searchText}
                fullWidth
                sx={{ marginBottom: 2 }}
            />
            <TableUsers users={filterUsers(users, Array.of(searchFilter))} tableHead={true} rowsPerPageDefault={100} rowsPerPageOptions={[100, 500, 1000, { label: "All", value: -1 }]} />
        </div>
    );
}