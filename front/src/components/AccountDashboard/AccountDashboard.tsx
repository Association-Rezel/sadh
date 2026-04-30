import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Drawer from "../Dashboard/Drawer";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import WifiFindIcon from '@mui/icons-material/WifiFind';
import MenuBar from "../Menus/MenuBar";
import { MembershipType } from "../../utils/types/types";
import { AccountBalance, Cancel, Payment } from "@mui/icons-material";
import { useAuthContext } from "../../pages/auth/AuthContext";

function AccountDashboard() {
    const { user } = useAuthContext();
    const [open, setOpen] = React.useState(true);
    const path = useLocation().pathname;

    const toggleDrawer = () => {
        setOpen(!open);
    };

    let dashboardContent = <Outlet />;
    if (path === "/account") {
        dashboardContent = (
            <Typography sx={{ p: 3 }}>
                Bienvenue sur votre compte !
            </Typography>
        );
    }

    const appoinmentLink = (
        <Link to={"appointment"}>
            <ListItemButton sx={{ whiteSpace: "normal" }}>
                <ListItemIcon>
                    <CalendarMonthIcon />
                </ListItemIcon>
                <ListItemText primary="Rendez-vous" />
            </ListItemButton>
        </Link>
    );
    const networkSettingsLink = (
        <Link to={"network"}>
            <ListItemButton>
                <ListItemIcon>
                    <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Mon réseau" />
            </ListItemButton>
        </Link>
    );
    const bankAccontSettings = <Link to={"bank-settings"}>
        <ListItemButton>
            <ListItemIcon>
                <AccountBalance />
            </ListItemIcon>
            <ListItemText primary="Mon RIB" />
        </ListItemButton>
    </Link>;
    const paymentsLink = (
        <Link to={"payments"}>
            <ListItemButton>
                <ListItemIcon>
                    <Payment />
                </ListItemIcon>
                <ListItemText primary="Mes paiements" />
            </ListItemButton>
        </Link>
    );
    const connectedDevicesLink = (
        <Link to={"connected-devices"}>
            <ListItemButton sx={{ whiteSpace: "normal" }}>
                <ListItemIcon>
                    <WifiFindIcon />
                </ListItemIcon>
                <ListItemText 
                    primary="Mes appareils connectés" 
                />
            </ListItemButton>
        </Link>
    );
    const resiliationLink = (
        <Link to={"resiliation"}>
            <ListItemButton>
                <ListItemIcon>
                    <Cancel />
                </ListItemIcon>
                <ListItemText primary="Résilier" />
            </ListItemButton>
        </Link>
    );

    let drawerContent = <Outlet />;
    if (user?.membership?.type == MembershipType.FTTH) {
        if (user?.membership?.unetid) {
            drawerContent = (
                <>
                    {appoinmentLink}
                    {networkSettingsLink}
                    {connectedDevicesLink}
                    {/*bankAccontSettings*/}
                    {paymentsLink}
                    {resiliationLink}
                </>
            );
        } else { // S'il n'a pas encore eu son rendez-vous
            drawerContent = (
                <>
                    {appoinmentLink}
                    {paymentsLink}
                    {resiliationLink}
                </>
            );
        }
    } else { // WIFI
        drawerContent = (
            <>
                {networkSettingsLink}
                {paymentsLink}
                {connectedDevicesLink}
                {resiliationLink}
            </>
        );
    }

    return (
        <>
            <MenuBar />

            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <Drawer variant="permanent" open={open} >
                    <Toolbar
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            px: [1],
                        }}
                    >
                        <IconButton onClick={toggleDrawer}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Toolbar>
                    <List component="nav" >
                        {drawerContent}
                    </List>
                </Drawer>
                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) =>
                            theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[900],
                        flexGrow: 1,
                        height: "100vh",
                        overflow: "auto",
                    }}
                >
                    <Container sx={{ mt: 4, mb: 4 }} maxWidth={false} disableGutters>
                        {dashboardContent}
                    </Container>
                </Box>
            </Box>
        </>
    );
}

export default AccountDashboard;
