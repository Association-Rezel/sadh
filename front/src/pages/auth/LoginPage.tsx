import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { OIDCContext } from "../../utils/OIDCContext"; 
import { Button, Typography } from "@mui/material";
import logoRezel from "../../ressources/img/cotcot.svg"

export default function LoginPage() {
    let oidcAuth = useContext(OIDCContext);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/signup") {
            oidcAuth.userManager.signinRedirect({ prompt: "create" });
        } else if (location.pathname === "/login") {
            oidcAuth.userManager.signinRedirect();
        }
    }, [location, oidcAuth]);
    if (location.pathname === "/login" || location.pathname === "/signup") {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-10">
            <img src={logoRezel} alt="logo" style={{ height: 100 }} />
            <Typography className="max-w-xl" variant="h4" align="center" color="text.primary" component="div">
                Créez un compte pour continuer
            </Typography>
            <div className="flex flex-col items-center gap-4 w-96">
                <Button
                    variant="contained"
                    className="bg-blue-500 text-white py-2 px-4 rounded"
                    onClick={() => oidcAuth.userManager.signinRedirect({ prompt: "create" })} //rajoute la query prompt=create, et Caddy (reverse proxy devant authentik) va rediriger vers la page de création de compte
                    fullWidth
                >
                    Créer un compte
                </Button>
                <Button
                    variant="outlined"
                    className="bg-blue-500 text-white py-2 px-4 rounded"
                    onClick={() => oidcAuth.userManager.signinRedirect()}
                    fullWidth
                >
                    Se connecter
                </Button>
            </div>
        </div>
    );
}
