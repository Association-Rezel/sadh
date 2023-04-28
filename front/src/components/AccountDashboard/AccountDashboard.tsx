import * as React from "react";
import { styled } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { secondaryListItems } from "../../pages/account/listItems";
import Chart from "../../pages/account/Chart";
import Deposits from "../../pages/account/Deposits";
import HeaderDashboard from "../Dashboard/HeaderDashboard";
import { Copyright } from "@mui/icons-material";
import Drawer from "../Dashboard/Drawer";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RouterIcon from "@mui/icons-material/Router";
import { Link as RouterLink } from "react-router-dom";
import PushPinIcon from '@mui/icons-material/PushPin';

function AccountDashboard() {
    const [open, setOpen] = React.useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <HeaderDashboard open={open} toggleDrawer={toggleDrawer} title="Account Dashboard" />
            <Drawer variant="permanent" open={open}>
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
                <Divider />
                <List component="nav">
                    <Link to={"orders"}>
                    <ListItemButton>
                        <ListItemIcon>
                            <ShoppingCartIcon />
                        </ListItemIcon>
                        <ListItemText primary="Orders" />
                    </ListItemButton>
                    </Link>
                    <Link to={"DHCP"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <PushPinIcon />
                            </ListItemIcon>
                            <ListItemText primary="DHCP" />
                        </ListItemButton>
                    </Link>
                    <RouterLink to={"boxe"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <RouterIcon />
                            </ListItemIcon>
                            <ListItemText primary="Boxe" />
                        </ListItemButton>
                    </RouterLink>

                    <Divider sx={{ my: 1 }} />
                    {secondaryListItems}
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
                <Toolbar />

                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
}

export default AccountDashboard;
