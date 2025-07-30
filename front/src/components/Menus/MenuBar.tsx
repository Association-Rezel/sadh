import { useState } from "react";
import { Link } from "react-router-dom";
import { AppBar, Box, Button, CssBaseline, Divider, Drawer, GlobalStyles, Icon, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material";
import logoRezel from "../../ressources/img/cotcot.svg"
import MenuIcon from '@mui/icons-material/Menu';
import { MembershipStatus } from "../../utils/types/types";
import { useAuthContext } from "../../pages/auth/AuthContext";

const drawerWidth = 240;

function MenuBar() {
    const { user, admin } = useAuthContext();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(0);

    const handleDrawerToggle = () => {
        setShowAdminLogin(showAdminLogin + 1);
        setMobileOpen((prevState) => !prevState);
    };

    const navItems = [
        { text: "Connexion Admin", backendLink: true, link: "/auth/login/admin/", condition: showAdminLogin > 5 },
        { text: "Mon compte", backendLink: false, link: "/account", condition: [MembershipStatus.ACTIVE, MembershipStatus.PENDING_INACTIVE].includes(user?.membership?.status) },
        { text: "Interface admin", backendLink: false, link: "/admin", condition: admin },
        { text: "Déconnexion", backendLink: true, link: "/auth/logout", condition: user || admin },
        { text: "Connexion", backendLink: true, link: "/auth/login/user/", condition: !user },
        { text: "Inscription", backendLink: true, link: "/auth/login/user/?prompt=create", condition: !user }
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            {window.location.pathname === "/" ? (
                <IconButton onClick={() => setShowAdminLogin(showAdminLogin + 1)}>
                    <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                </IconButton>
            ) : (
                <IconButton>
                    <Link to={"/"}>
                        <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                    </Link>
                </IconButton>
            )}
            <Divider />
            <List>
                {navItems.map((item) => (
                    item.condition && (
                        <ListItem
                            key={item.text}
                            component={item.backendLink ? "a" : Link}
                            {...(item.backendLink ?
                                { href: item.link }
                                : { to: item.link })}
                        >
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

                    <div className="sm:block hidden">
                        {window.location.pathname === "/" ? (
                            <div className="cursor-pointer" onClick={() => setShowAdminLogin(showAdminLogin + 1)}>
                                <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                            </div>
                        ) : (
                            <Link to={"/"}>
                                <img src={logoRezel} alt="logo" style={{ height: 50 }} />
                            </Link>
                        )}
                    </div>

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {navItems.map((item) => (
                            item.condition && (
                                <Button key={item.text} sx={{ color: '#fff' }}>
                                    {item.backendLink ? (
                                        <a href={item.link}>
                                            {item.text}
                                        </a>
                                    ) : (
                                        <Link to={item.link}>
                                            {item.text}
                                        </Link>
                                    )}
                                </Button>
                            )
                        ))}
                    </Box>
                </Toolbar>
            </AppBar>
            <nav>
                <Drawer
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

export default MenuBar;
