import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import StarIcon from "@mui/icons-material/StarBorder";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Fragment, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';
import { AppStateContext } from "../../utils/AppStateContext";
import { MembershipType } from "../../utils/types/types";


function Copyright(props: any) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {"Copyright © "}
            <Link color="inherit" to="https://rezel.net/">
                Rezel
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

const footers = [
    {
        title: "Company",
        description: ["Team", "History", "Contact us", "Locations"],
    },
    {
        title: "Features",
        description: ["Cool stuff", "Random feature", "Team feature", "Developer stuff", "Another one"],
    },
    {
        title: "Resources",
        description: ["Resource", "Resource name", "Another resource", "Final resource"],
    },
    {
        title: "Legal",
        description: ["Privacy policy", "Terms of use"],
    },
];

function PricingContent() {
    const { appState } = useContext(AppStateContext);

    const tiers = [
        {
            title: "Box fibre",
            subheader: "",
            price: "20",
            description: ["1Gb/s symétrique", "Sans engagement", "0€ de frais d'installation", "0€ de frais de résiliation"],
            tooltips: [null, "Rezel est une association à laquelle vous cotiserez, vous octroyant le statut d'adhérent. Il ne peut pas y avoir de notion d'engagement.", null, null],
            buttonText: "J'adhère",
            buttonRedirectPath: "/adherer/ftth",
            buttonVariant: "contained",
            disabled: appState?.user?.membership?.type === MembershipType.WIFI,
        },
        {
            title: "Wi-Fi",
            subheader: "",
            price: "10",
            description: ["Jusqu'à 300Mb/s symétrique", "Sans engagement", "0€ de frais d'installation", "0€ de frais de résiliation"],
            tooltips: ["Selon le niveau de réception du signal", "Rezel est une association à laquelle vous cotiserez, vous octroyant le statut d'adhérent. Il ne peut pas y avoir de notion d'engagement.", null, null],
            buttonText: "J'adhère",
            buttonRedirectPath: "/adherer/wifi",
            buttonVariant: "contained",
            disabled: appState?.user?.membership?.type === MembershipType.FTTH,
        },
    ];

    const navigate = useNavigate();

    return (
        <Fragment>
            {/* Hero unit */}
            <Container disableGutters maxWidth="md" component="main" sx={{ pt: 8, pb: 6 }}>
                <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                    Rezel FAI
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" component="p">
                    Vous souhaitez la fibre optique directement dans votre logement ?
                </Typography>
                <Typography variant="h6" align="center" color="text.secondary" component="p">
                    Rezel propose un accès à internet pour 20€/mois !
                </Typography>
            </Container>
            {/* End hero unit */}
            <Container maxWidth="md" component="main">
                <Grid
                    container spacing={5}
                    alignItems="flex-end"
                    justifyContent="center">
                    {tiers.map((tier) => (
                        // Enterprise card is full width at sm breakpoint
                        <Grid item key={tier.title} className="w-80">
                            <Card>
                                <CardHeader
                                    title={tier.title}
                                    subheader={tier.subheader}
                                    titleTypographyProps={{ align: "center" }}
                                    subheaderTypographyProps={{
                                        align: "center",
                                    }}
                                    sx={{
                                        backgroundColor: (theme) =>
                                            theme.palette.mode === "light"
                                                ? theme.palette.grey[200]
                                                : theme.palette.grey[700],
                                    }}
                                />
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "baseline",
                                            mb: 2,
                                        }}
                                    >
                                        <Typography component="h2" variant="h3" color="text.primary">
                                            {tier.price}€
                                        </Typography>
                                        <Typography variant="h6" color="text.secondary">
                                            /mois
                                        </Typography>
                                    </Box>
                                    <div className="flex justify-center">
                                        <ul>
                                            {tier.description.map((line, i) => (
                                                <Typography component="li" variant="subtitle1" align="left" className="flex" key={line}>
                                                    {line}
                                                    {tier.tooltips[i] &&
                                                        <Tooltip title={tier.tooltips[i]}>
                                                            <HelpIcon fontSize="small" className="ml-2 self-center" />
                                                        </Tooltip>
                                                    }
                                                </Typography>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        fullWidth
                                        variant={tier.buttonVariant as "outlined" | "contained"}
                                        onClick={() => navigate(tier.buttonRedirectPath)}
                                        disabled={tier.disabled}
                                    >
                                        {tier.buttonText}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
            {/* Footer */}
            <Container
                maxWidth="md"
                component="footer"
                sx={{
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    mt: 6,
                    py: [3, 6],
                }}
            >
                {/*
                <Grid container spacing={4} justifyContent="space-evenly">
                    {footers.map((footer) => (
                        <Grid item xs={6} sm={3} key={footer.title}>
                            <Typography variant="h6" color="text.primary" gutterBottom>
                                {footer.title}
                            </Typography>
                            <ul>
                                {footer.description.map((item) => (
                                    <li key={item}>
                                        <Link href="#" variant="subtitle1" color="text.secondary">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Grid>
                    ))}
                </Grid>
                */}
                <Copyright />
            </Container>
            {/* End footer */}
        </Fragment>
    );
}

export default function Pricing() {
    return <PricingContent />;
}
