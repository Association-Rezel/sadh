import { CssBaseline, GlobalStyles, Typography } from "@mui/material";
import Container from "@mui/material/Container";
import React from "react";
import { Navigate } from "react-router-dom";
import PageAppointment from "../../pages/appointment/PageAppointment";
import { useAuthContext } from "../../pages/auth/AuthContext";
import { MembershipStatus } from "../../utils/types/types";
import MenuBar from "../Menus/MenuBar";
import FTTHMembershipForm from "./FTTHMembershipForm";
import PendingMembershipValidation from "./PendingMembershipValidation";
import WifiMembershipForm from "./WifiMembershipForm";


function BecomeMember(): JSX.Element {
    const { user } = useAuthContext();

    if (user?.membership && ![MembershipStatus.REQUEST_PENDING_VALIDATION, MembershipStatus.VALIDATED].includes(user?.membership.status)) {
        let content = {
            title: "Vous êtes déjà adhérent",
            text: "Retrouvez toutes les informations sur votre adhésion dans votre espace adhérent en cliquant sur \"Mon Compte\"."
        }

        return (
            <>
                <MenuBar />
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
    if(user && !user.membership) {
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

            <MenuBar />

            <React.Fragment>
                {user?.membership?.status == MembershipStatus.VALIDATED && (
                    <PageAppointment />
                )}
                <Container component="main" className="m-16">
                    {user?.membership?.status == MembershipStatus.REQUEST_PENDING_VALIDATION && (
                        <PendingMembershipValidation user={user} />
                    )}
                    {membershipForm}
                </Container>
            </React.Fragment>
        </>
    );
}


export default BecomeMember;
