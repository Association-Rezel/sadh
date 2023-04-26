import { Toolbar, IconButton, Typography, Badge } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MenuIcon from "@mui/icons-material/Menu";
import ExitToApp from "@mui/icons-material/ExitToApp";
import { styled } from "@mui/material/styles";
import { drawerWidth } from "../../utils/constants";
import { Link } from "react-router-dom";

interface HeaderDashboardProps {
    title: string;
    open: boolean;
    toggleDrawer: () => void;
}

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const HeaderDashboard = ({ title, toggleDrawer, open }: HeaderDashboardProps) => {
    return (
        <AppBar position="absolute" open={open}>
            <Toolbar
                sx={{
                    pr: "24px", // keep right padding when drawer closed
                }}
            >
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={toggleDrawer}
                    sx={{
                        marginRight: "36px",
                        ...(open && { display: "none" }),
                    }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>
                <IconButton color="inherit">
                    <Link to={"../"} style={{ color: '#FFF' }}>
                        <Badge color="secondary">
                            <ExitToApp />
                        </Badge>
                    </Link>
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};

export default HeaderDashboard;
