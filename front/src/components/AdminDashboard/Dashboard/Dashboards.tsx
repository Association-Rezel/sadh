import { useEffect, useState } from "react";
import { TableUsers } from "../../Users/TableUsers";
import { MembershipStatus, User } from "../../../utils/types/types";
import { StatusFilter, filterUsers, UserFilter } from "../../../filters/UserFilters";
import { Api } from "../../../utils/Api";
import { Typography } from "@mui/material";

export default function Dashboards() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        Api.fetchUsers().then((users: User[]) => {
            setUsers(users);
        });
    }, []);

    const pendingMembershipsFilter = new StatusFilter(MembershipStatus.REQUEST_PENDING_VALIDATION);

    // Users with a validated membership, no appointment and no availability slots
    const validatedWithoutFilter: UserFilter[] = [
        new StatusFilter(MembershipStatus.VALIDATED), 
        {
            filter(user: User): boolean {
                return user.availability_slots.length === 0 && user.membership?.appointment === null;
            }
        }
    ];

    // Users with a validated membership and, availability slots and no appointment
    const toConfirmAppointmentFilter: UserFilter = {
        filter(user: User): boolean {
            return user.availability_slots.length > 0 && user.membership?.appointment === null;
        }
    };

    // Users with an active membership and no CR MES sent (i.e we must send a CR MES asap)
    const crMesToSendFilter: UserFilter = {
        filter(user: User): boolean {
            return user.membership?.status === MembershipStatus.ACTIVE
                && !user.membership?.cr_mes_sent;
        }
    };

    // Users with an appointment and no CMD_ACCES sent (i.e we must send a CMD_ACCES asap)
    const cmdAccesToSendFilter: UserFilter = {
        filter(user: User): boolean {
            return user.membership
                && user.membership.appointment
                && !user.membership.cmd_acces_sent;
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 mt-5 gap-y-10">
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    Validés - Sans rendez-vous
                </Typography>
                <TableUsers users={filterUsers(users, validatedWithoutFilter)} />
            </div>
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    Rendez-vous en attente de validation
                </Typography>
                <TableUsers users={filterUsers(users, [toConfirmAppointmentFilter])} />
            </div>
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    CMD_ACCES à envoyer
                </Typography>
                <TableUsers users={filterUsers(users, [cmdAccesToSendFilter])} />
            </div>
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    CR MES à envoyer
                </Typography>
                <TableUsers users={filterUsers(users, [crMesToSendFilter])} />
            </div>
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    Utilisateurs en attente de validation
                </Typography>
                <TableUsers users={filterUsers(users, [pendingMembershipsFilter])} />
            </div>
        </div>
    );
}