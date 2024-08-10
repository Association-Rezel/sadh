import Container from "@mui/material/Container";
import { CssBaseline, GlobalStyles, Typography } from "@mui/material";
import { useContext } from "react";
import React from "react";
import { MembershipStatus } from "../../utils/types/types";
import LoggedMenu from "../Menus/LoggedMenu";
import { AppStateContext } from "../../utils/AppStateContext";
import MembershipForm from "./MembershipForm";
import PendingMembershipValidation from "./PendingMembershipValidation";
import PageAppointment from "../../pages/appointment/PageAppointment";


function BecomeMember(): JSX.Element {
    const { appState } = useContext(AppStateContext);

    if (appState.user?.membership && ![MembershipStatus.REQUEST_PENDING_VALIDATION, MembershipStatus.VALIDATED].includes(appState.user?.membership.status)) {
        let content = {
            title: "Vous êtes déjà adhérent",
            text: "Retrouvez toutes les informations sur votre adhésion dans votre espace client en cliquant sur \"Mon Compte\"."
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
                    </Container>
                </React.Fragment>
            </>
        );
    }

    return (
        <>
            <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: "none" } }} />
            <CssBaseline />

            <LoggedMenu />

            <React.Fragment>
                {appState.user?.membership?.status == MembershipStatus.VALIDATED && (
                    <PageAppointment />
                )}
                <Container component="main" className="m-16">
                    {appState.user?.membership?.status == MembershipStatus.REQUEST_PENDING_VALIDATION && (
                        <PendingMembershipValidation />
                    )}
                    {!appState.user?.membership && (
                        <MembershipForm />
                    )}
                </Container>
            </React.Fragment>
        </>
    );
}


export default BecomeMember;
