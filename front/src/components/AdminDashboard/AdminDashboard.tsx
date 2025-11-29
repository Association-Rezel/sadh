import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import HeaderDashboard from "../Dashboard/HeaderDashboard";
import Drawer from "../Dashboard/Drawer";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import DebugIcon from "@mui/icons-material/BugReport";
import EvenListIcon from "@mui/icons-material/EventNote";
import { Download, Euro } from "@mui/icons-material";

function AdminDashboard() {
    const [open, setOpen] = React.useState(true);
    const toggleDrawer = () => {
        setOpen(!open);
    };

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <HeaderDashboard open={open} toggleDrawer={toggleDrawer} title="Admin Dashboard" />
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
                    <Link to={""}>
                        <ListItemButton>
                            <ListItemIcon>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary="Dashboard" />
                        </ListItemButton>
                    </Link>

                    <Link to={"users"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Abonnés" />
                        </ListItemButton>
                    </Link>

                    <Link to={"calendar"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <CalendarIcon />
                            </ListItemIcon>
                            <ListItemText primary="Calendrier" />
                        </ListItemButton>
                    </Link>

                    <Link to={"olt-debug"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <DebugIcon />
                            </ListItemIcon>
                            <ListItemText primary="OLT Debug" />
                        </ListItemButton>
                    </Link>

                    <Link to={"logs-ipam"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <EvenListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logs IPAM" />
                        </ListItemButton>
                    </Link>

                    <Link to={"partial-refunds"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <Euro />
                            </ListItemIcon>
                            <ListItemText primary="Remboursements" />
                        </ListItemButton>
                    </Link>
                    <Link to={"ptah-images"}>
                        <ListItemButton>
                            <ListItemIcon>
                                <Download />
                            </ListItemIcon>
                            <ListItemText primary="Images Ptah" />
                        </ListItemButton>
                    </Link>
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

export default AdminDashboard;
