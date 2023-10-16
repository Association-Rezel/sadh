import { useContext, useState } from "react";
import { keycloak } from "../../utils/keycloak";
import { AppStateContext, updateAppState } from "../../utils/AppState";
import { Api } from "../../utils/Api";
import { Link } from "react-router-dom";
import { AppBar, Button, CssBaseline, GlobalStyles, IconButton, Toolbar } from "@mui/material";
import logoRezel from "../../ressources/img/cotcot.svg"
import { SubscriptionStatus } from "../../utils/types";

function LoggedMenu() {
    const appState = useContext(AppStateContext);

    const logout = () => {
        Api.logout();
        keycloak.logout();
    }

    if (appState.logged) {
        return (
            <div>
                <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: "none" } }} />
                <CssBaseline />
                <AppBar
                    position="static"
                    color="default"
                    elevation={0}
                    sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
                >
                    <Toolbar sx={{ flexWrap: "wrap" }} >
                        <div style={{ position: 'absolute', left: 0 }}>
                            <IconButton>
                                <Link to={"/"}>
                                    <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                                </Link>
                            </IconButton>
                        </div>
                        <div style={{ position: 'absolute', right: 0}}>
                            <Button >
                                <Link to={"/account/appointment"}>Mon compte</Link>
                            </Button>
                            {(appState.subscription && appState.subscription?.status != SubscriptionStatus.PENDING_VALIDATION && appState.subscription?.status != SubscriptionStatus.REJECTED) && (
                                <Button>
                                    <Link to={"/contract"}>Contrat</Link>
                                </Button>
                            )}
                            {appState.user?.is_admin && (
                                <Button>
                                    <Link to={"/admin"}>Interface admin</Link>
                                </Button>
                            )}
                            <Button onClick={logout}>
                                { /* TODO : déconnexion auprès du Keycloak également */}
                                Déconnexion
                            </Button>
                        </div>
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
    return (
        <div>
            <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: "none" } }} />
            <CssBaseline />
            <AppBar
                position="static"
                color="default"
                elevation={0}
                sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
            >
                <Toolbar sx={{ flexWrap: "wrap" }} >
                    <div style={{ position: 'absolute', left: 0 }}>
                        <IconButton>
                            <Link to={"/"}>
                                <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                            </Link>
                        </IconButton>
                    </div>
                    <div style={{ position: 'absolute', right: 0 }}>
                        <Button onClick={() => Api.login()}>Connexion</Button>
                    </div>
                </Toolbar>
            </AppBar>
        </div>
    );
}

export default LoggedMenu;
