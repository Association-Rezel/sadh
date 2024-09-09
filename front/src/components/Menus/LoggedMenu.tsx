import { useContext, useState } from "react";
import { AppStateContext } from "../../utils/AppStateContext";
import { Link } from "react-router-dom";
import { AppBar, Box, Button, CssBaseline, Divider, Drawer, GlobalStyles, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material";
import logoRezel from "../../ressources/img/cotcot.svg"
import MenuIcon from '@mui/icons-material/Menu';
import { MembershipStatus } from "../../utils/types/types";

const drawerWidth = 240;

function LoggedMenu() {
    const { appState } = useContext(AppStateContext);

    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const navItems = [
        { text: "Mon compte", link: "/account", condition: [MembershipStatus.ACTIVE, MembershipStatus.PENDING_INACTIVE].includes(appState.user?.membership?.status) },
        { text: "Interface admin", link: "/admin", condition: appState.admin },
        { text: "Déconnexion", link: "/logout", condition: appState.user },
        { text: "Connexion", link: "/login", condition: !appState.user },
        { text: "Inscription", link: "/signup", condition: !appState.user }
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <IconButton>
                <Link to={"/"}>
                    <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                </Link>
            </IconButton>
            <Divider />
            <List>
                {navItems.map((item) => (
                    item.condition && (
                        <ListItem key={item.text} component={Link} to={item.link}>
                            <ListItemButton sx={{ textAlign: 'center' }}>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    )
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                component="nav"
                position="static"
                color="default"
                elevation={0}
                sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }} >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <IconButton sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Link to={"/"}>
                            <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                        </Link>
                    </IconButton>

                    <Box sx={{ flexGrow: 1 }} />


                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {navItems.map((item) => (
                            item.condition && (
                                <Button key={item.text} sx={{ color: '#fff' }}>
                                    <Link to={item.link}>{item.text}</Link>
                                </Button>
                            )
                        ))}
                    </Box>
                </Toolbar>
            </AppBar>
            <nav>
                <Drawer
                    // container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
            </nav>
        </Box>
    );
}

export default LoggedMenu;
