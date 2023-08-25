import Container from "@mui/material/Container";
import { CssBaseline, GlobalStyles, Typography} from "@mui/material";
import { useContext } from "react";
import React from "react";

import { Status } from "../../utils/types";
import LoggedMenu from "../Menus/LoggedMenu";
import {AppStateContext} from "../../utils/AppState";
import { SubscriptionForm, SubscriptionFormEdit } from "../Forms/SubscriptionForm";


function Subscribe() : JSX.Element {
    let appState = useContext(AppStateContext);

    if (appState.subscription) {
        let content = {
            title: "Vous êtes déjà abonné",
            text: "Retrouvez toutes les informations sur votre abonnement dans votre espace client en cliquant sur \"Mon Compte\"."
        }

        if (appState.subscription.status == Status.PENDING_VALIDATION) {
            content = {
                title: "Votre demande d'adhésion est en cours de validation",
                text: "Vous recevrez prochainement un mail d'information."
            }
        }
        return (
            <>
                <LoggedMenu />
                <React.Fragment>
                    <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
                        <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                            {content.title}
                        </Typography>
                        <Typography variant="h5" align="center" color="text.secondary" component="p">
                            {content.text}
                        </Typography>
                        { appState.subscription.status == Status.PENDING_VALIDATION ? SubscriptionFormEdit() : null}
                    </Container>
                </React.Fragment>
            </>        
        );
    }

    return (
        <>
            <GlobalStyles styles={{ul: {margin: 0, padding: 0, listStyle: "none"}}}/>
            <CssBaseline/>
            
            <LoggedMenu />

            <React.Fragment>
                <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
                    <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                        Vous n'êtes pas encore adhérent FAI de Rezel !
                    </Typography>
                    <Typography variant="h5" align="center" color="text.secondary" component="p">
                        Pour effectuer une demande d'adhésion, veuillez renseigner les informations ci-dessous.
                    </Typography>
                    {SubscriptionForm()}
                </Container>
            </React.Fragment>
        </>        
    );
}


export default Subscribe;
