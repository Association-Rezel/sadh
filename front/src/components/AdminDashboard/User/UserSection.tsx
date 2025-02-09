import { ContentCopy } from "@mui/icons-material";
import { User } from "../../../utils/types/types";
import { Button, IconButton, Tooltip, Typography } from "@mui/material";

export default function UserSection({ user }: { user: User }) {
    if (!user) return (<>Chargement...</>);

    return (
        <div className="flex flex-col items-center">
            <Typography variant="h3" align="center" color="text.primary" component="div" className="flex flex-row gap-4 items-baseline">
                <div>Adhérent : {user.first_name} {user.last_name}</div>
                <Tooltip title="Copier l'identifiant">
                    <IconButton
                        onClick={() => navigator.clipboard.writeText(user.id)}
                        size="small"
                    >
                        <ContentCopy />
                    </IconButton>
                </Tooltip>
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <div className="flex flex-row gap-8">
                    <strong>{user.email} - {user.phone_number ? user.phone_number : "NO PHONE NUMBER"}</strong>
                    <a href={`https://treso.rezel.net/adherents/card.php?rowid=${user.dolibarr_id}`} target="_blank" rel="noreferrer">
                        Dolibarr ID : {user.dolibarr_id}
                    </a>
                </div>
            </Typography>
        </div>
    )
}