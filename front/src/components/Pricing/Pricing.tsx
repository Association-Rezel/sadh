import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import StarIcon from "@mui/icons-material/StarBorder";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import GlobalStyles from "@mui/material/GlobalStyles";
import Container from "@mui/material/Container";

function Copyright(props: any) {
    return (
        <Typography variant="body2" color="text.secondary" align="center" {...props}>
            {"Copyright © "}
            <Link color="inherit" href="https://rezel.net/">
                Rezel
            </Link>{" "}
            {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

const tiers = [
    {
        title: "Box",
        subheader: "",
        price: "20",
        description: ["Votre propre box chez vous", "Configuration de vos ports"],
        buttonText: "J'adhère",
        buttonVariant: "contained",
    },
    /*{
        title: "WiFi",
        subheader: "",
        price: "10",
        description: ["WiFi accessible à distance", "(sous réserve de disponibilité)","slip anti-ondes inclus"],
        buttonText: "jaccepte",
        buttonVariant: "contained",
    },*/
];
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
    return (
        <React.Fragment>
            {/* Hero unit */}
            <Container disableGutters maxWidth="sm" component="main" sx={{ pt: 8, pb: 6 }}>
                <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                    Formes d'adhésion
                </Typography>
                <Typography variant="h5" align="center" color="text.secondary" component="p">
                    Rezel vous propose plusieurs formes d'adhésion, à vous de choisir celle qui vous convient le mieux !
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
                        <Grid item key={tier.title} xs={12} sm={tier.title === "Enterprise" ? 12 : 6} md={4}>
                            <Card>
                                <CardHeader
                                    title={tier.title}
                                    subheader={tier.subheader}
                                    titleTypographyProps={{ align: "center" }}
                                    action={tier.title === "Pro" ? <StarIcon /> : null}
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
                                    <ul>
                                        {tier.description.map((line) => (
                                            <Typography component="li" variant="subtitle1" align="center" key={line}>
                                                {line}
                                            </Typography>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardActions>
                                    <Button fullWidth variant={tier.buttonVariant as "outlined" | "contained"}>
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
        </React.Fragment>
    );
}

export default function Pricing() {
    return <PricingContent />;
}
