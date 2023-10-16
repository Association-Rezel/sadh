import Typography from "@mui/material/Typography";
import LoggedMenu from "../components/Menus/LoggedMenu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { Api } from "../utils/Api";


export default function LoginPage() {
    return (
        <>
            <LoggedMenu />
            <Container disableGutters maxWidth="md" component="main" sx={{ pt: 8, pb: 6 }}>
                <Typography component="h5" variant="h5" align="center" color="text.primary" gutterBottom>
                    Vous devez être connecté pour accéder à cette page.
                </Typography>

                

            </Container>
            <Button variant="contained" size="large" onClick={() => Api.login()}>SE CONNECTER</Button>
        </>
    );
}