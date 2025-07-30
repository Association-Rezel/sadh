import { Button, Typography } from "@mui/material";
import logoRezel from "../../ressources/img/cotcot.svg"

export default function LoginPage() {

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
                    onClick={() => window.location.href = "/auth/login/user?prompt=create&success_uri=" + encodeURIComponent(window.location.href)}
                    fullWidth
                >
                    Créer un compte
                </Button>
                <Button
                    variant="outlined"
                    className="bg-blue-500 text-white py-2 px-4 rounded"
                    onClick={() => window.location.href = "/auth/login/user?success_uri=" + encodeURIComponent(window.location.href)}
                    fullWidth
                >
                    Se connecter
                </Button>
            </div>
        </div>
    );
}
