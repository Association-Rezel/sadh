import { useEffect, useState } from "react";
import { TableUsers } from "../../Users/TableUsers";
import { AppointmentStatus, SubscriptionStatus, UserDataBundle } from "../../../utils/types";
import { StatusFilter, filterUsers, UserFilter } from "../../../filters/UserFilters";
import { Api } from "../../../utils/Api";
import { Typography } from "@mui/material";

export default function Dashboards() {
    const [users, setUsers] = useState<UserDataBundle[]>([]);

    useEffect(() => {
        Api.fetchUserDataBundles().then((users: UserDataBundle[]) => {
            setUsers(users);
        });
    }, []);

    const pendingSubscriptionsFilter = new StatusFilter(SubscriptionStatus.PENDING_VALIDATION);

    const noAppointmentFilter: UserFilter = {
        filter(user: UserDataBundle): boolean {
            return user.appointments.length === 0;
        }
    };
    const validatedWithoutFilter: UserFilter[] = [new StatusFilter(SubscriptionStatus.VALIDATED), noAppointmentFilter];

    const appointmentsNotValidated: UserFilter = {
        filter(user: UserDataBundle): boolean {
            return user.appointments.some(appointment => appointment.status === AppointmentStatus.PENDING_VALIDATION);
        }
    };

    const pastAppointNoMesSentFilter: UserFilter = {
        filter(user: UserDataBundle): boolean {
            return user.appointments.some(
                appointment => appointment.status === AppointmentStatus.VALIDATED && appointment.slot.start < new Date())
                && !user.flow.cr_mes_sent;
        }
    };

    return (
        <div className="grid grid-cols-2 gap-4 mt-5 gap-y-10">
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    En attente de validation
                </Typography>
                <TableUsers users={filterUsers(users, [pendingSubscriptionsFilter])} />
            </div>
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
                <TableUsers users={filterUsers(users, [appointmentsNotValidated])} />
            </div>
            <div>
                <Typography variant="h6" align="center" color="text.primary" component="div" sx={{ marginBottom: 3 }}>
                    CR MES à envoyer
                </Typography>
                <TableUsers users={filterUsers(users, [pastAppointNoMesSentFilter])} />
            </div>
        </div>
    );
}