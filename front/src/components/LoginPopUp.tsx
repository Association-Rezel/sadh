import { Button, Dialog, DialogTitle, List, ListItem, Typography } from "@mui/material";
import { Api } from "../utils/Api";
import { useUser } from "../utils/hooks";
import { Link } from "react-router-dom";

export interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
}

const LoginDialog = ({ onClose, open }: SimpleDialogProps) => {
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Login</DialogTitle>
            <ButtonLogin onAction={onClose} />
        </Dialog>
    );
};

const ButtonLogin = ({ onAction }) => {
    const user = useUser();

    const loginCall = () => {
        Api.fetchMe().then(() => {
            onAction();
        });
    };
    if (user) {
        return (
            <>
                <Typography>Vous êtes connecté</Typography>
                <List sx={{ pt: 0 }}>
                    <ListItem>
                        <Button onClick={loginCall}>
                            <Link to={"/account"}>Mon compte</Link>
                        </Button>
                    </ListItem>
                    <ListItem>
                        <Button onClick={loginCall}>
                            {user.isAdmin && <Link to={"/admin"}>Interface admin</Link>}
                        </Button>
                    </ListItem>
                </List>
            </>
        );
    }
    return (
        <>
            <Typography>Vous n'êtes pas connecté :/</Typography>
            <span>Login with Rezel</span>
        </>
    );
};

export default LoginDialog;
