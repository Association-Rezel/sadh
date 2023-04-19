import { Link } from "react-router-dom";
import Pricing from "../components/Pricing/Pricing";
import { GlobalStyles, CssBaseline, AppBar, Toolbar, Typography, Button } from "@mui/material";
import LoginDialog from "../components/LoginPopUp";
import { useState } from "react";

export default () => {
    const [open, setOpen] = useState<boolean>(false);
    return (
        <>
            <GlobalStyles styles={{ ul: { margin: 0, padding: 0, listStyle: "none" } }} />
            <CssBaseline />
            <AppBar
                position="static"
                color="default"
                elevation={0}
                sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
            >
                <Toolbar sx={{ flexWrap: "wrap" }}>
                    <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                        FAIPP
                    </Typography>
                    <Button
                        href="#"
                        onClick={() => {
                            setOpen(true);
                        }}
                        variant="outlined"
                        sx={{ my: 1, mx: 1.5 }}
                    >
                        Login
                    </Button>
                    <LoginDialog
                        open={open}
                        onClose={() => {
                            setOpen(false);
                        }}
                    />
                </Toolbar>
            </AppBar>
            <Pricing />
        </>
    );
};
