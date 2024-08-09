import { User } from "../../../utils/types/types";
import { Typography } from "@mui/material";

export default function UserSection({ user }: { user: User }) {
    if (!user) return (<>Chargement...</>);

    return (
        <div>
            <Typography variant="h3" align="center" color="text.primary" component="div" sx={{ marginTop: 3 }}>
                Adhérent : {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>{user.email} - {user.phone_number ? user.phone_number : "NO PHONE NUMBER"}</strong>
            </Typography>
        </div>
    )
}