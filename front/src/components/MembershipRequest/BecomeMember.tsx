import Container from "@mui/material/Container";
import { CssBaseline, GlobalStyles, Typography } from "@mui/material";
import { useContext } from "react";
import React from "react";
import { MembershipStatus, MembershipType } from "../../utils/types/types";
import LoggedMenu from "../Menus/LoggedMenu";
import { AppStateContext } from "../../utils/AppStateContext";
import FTTHMembershipForm from "./FTTHMembershipForm";
import PendingMembershipValidation from "./PendingMembershipValidation";
import PageAppointment from "../../pages/appointment/PageAppointment";
import WifiMembershipForm from "./WifiMembershipForm";
import { Navigate } from "react-router-dom";


function BecomeMember(): JSX.Element {
    const { appState } = useContext(AppStateContext);

    if (appState.user?.membership && ![MembershipStatus.REQUEST_PENDING_VALIDATION, MembershipStatus.VALIDATED].includes(appState.user?.membership.status)) {
        let content = {
            title: "Vous êtes déjà adhérent",
            text: "Retrouvez toutes les informations sur votre adhésion dans votre espace adhérent en cliquant sur \"Mon Compte\"."
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

    let membershipForm = null;
    if(appState.user && !appState.user.membership) {
        if(window.location.pathname.endsWith("ftth")) {
            membershipForm = <FTTHMembershipForm />;
        }
        else if (window.location.pathname.endsWith("wifi")) {
            membershipForm = <WifiMembershipForm />;
        }
        else {
            membershipForm = <Navigate to="/" />;
        }
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
                        <PendingMembershipValidation user={appState.user} />
                    )}
                    {membershipForm}
                </Container>
            </React.Fragment>
        </>
    );
}


export default BecomeMember;
