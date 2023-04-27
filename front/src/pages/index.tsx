import {Link} from "react-router-dom";
import Pricing from "../components/Pricing/Pricing";
import {AppBar, Button, CssBaseline, GlobalStyles, Toolbar, Typography} from "@mui/material";
import {useContext, useState} from "react";
import {keycloak} from "../utils/keycloak";
import {AppStateContext, updateAppState} from "../utils/AppState";
import {Api} from "../utils/Api";


function LoggedMenu() {
    const appState = useContext(AppStateContext);
    if (appState.logged) {
        return (
            <>
                <Button>
                    <Link to={"/account"}>Mon compte</Link>
                </Button>
                <Button>
                    {appState.user?.isAdmin && <Link to={"/admin"}>Interface admin</Link>}
                </Button>
                <Button onClick={() => Api.logout()}>
                    { /* TODO : déconnexion auprès du Keycloak également */ }
                    Déconnexion
                </Button>
            </>
        );
    }
    return (
        <>
            <Button onClick={() => Api.login()}>Connexion</Button>
        </>
    );
}

export default () => {
    const [open, setOpen] = useState<boolean>(false);


    return (
        <>
            <GlobalStyles styles={{ul: {margin: 0, padding: 0, listStyle: "none"}}}/>
            <CssBaseline/>
            <AppBar
                position="static"
                color="default"
                elevation={0}
                sx={{borderBottom: (theme) => `1px solid ${theme.palette.divider}`}}
            >
                <Toolbar sx={{flexWrap: "wrap"}}>
                    <Typography variant="h6" color="inherit" noWrap sx={{flexGrow: 1}}>
                        FAIPP
                    </Typography>
                    <LoggedMenu/>
                </Toolbar>
            </AppBar>
            <Pricing/>
        </>
    );
};
