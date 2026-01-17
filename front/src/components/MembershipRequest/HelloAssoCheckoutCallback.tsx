import {Typography, CircularProgress} from "@mui/material";
import Container from "@mui/material/Container";
import React from "react";
import {useSearchParams} from "react-router-dom";
import MenuBar from "../Menus/MenuBar";

import {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router";
import Api, {BackendResponseError} from "../../utils/Api";
import {useAuthContext} from "../../pages/auth/AuthContext";

export default function HelloAssoCheckoutCallback(): JSX.Element {
    const navigate = useNavigate();
    const { checkAuthStatus } = useAuthContext();

    const [searchParams, _] = useSearchParams();

    const checkoutIdStr = searchParams.get("checkoutIntentId") || undefined;
    const checkoutId = checkoutIdStr ? parseInt(checkoutIdStr) : undefined;
    const [isCheckoutValid, setIsCheckoutValid] = useState<boolean>(checkoutId !== undefined && !isNaN(checkoutId));

    const update_payment_validation = useCallback(async () => {
        if (!isCheckoutValid) return;
        try {
            const isCheckoutComplete = await Api.getCheckoutStatus(checkoutId);
            if (isCheckoutComplete.is_complete) {
                await checkAuthStatus(); // User status might have changed, refresh it
                navigate(isCheckoutComplete.return_url);
            }
        } catch (e) {
            if (e instanceof BackendResponseError) {
                setIsCheckoutValid(false);
            }
        }
    }, [navigate, isCheckoutValid])

    useEffect(() => {
        if (isCheckoutValid) {
            const interval = setInterval(update_payment_validation, 4000);
            return () => clearInterval(interval);
        }
    }, [isCheckoutValid]);

    if (!isCheckoutValid) {
        return <>
            <MenuBar/>
            <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
                <Typography component="h2" variant="h2" align="center" color="text.primary" gutterBottom>
                    Paiement invalide
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Une erreur est survenue durant le paiement. Si vous avez été débités et que votre achat ne vous
                    est pas
                    disponible, n'hésitez pas à contacter Rezel.
                </Typography>
                <a href="/adherer">Retourner à la page d'accueil</a>
            </Container>
        </>
    } else
        return (
            <>
                <MenuBar/>
                <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
                    <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                        Paiement en cours de traitement...
                    </Typography>
                    <Typography variant="h5" align="center" color="text.secondary" component="p" gutterBottom>
                        <CircularProgress size="1.7em" color="inherit"/>
                        <br/>
                        Tu y es presque !
                    </Typography>
                    <Typography variant="body1">
                        En cas de difficultés, n'hésite pas à contacter Rezel
                    </Typography>
                </Container>
            </>
        );

}