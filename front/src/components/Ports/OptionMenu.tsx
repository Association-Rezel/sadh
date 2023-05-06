
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton } from '@mui/material';
import React from 'react';


export default function OptionMenu({openPorts, setOpenPorts, id}) {
    const portRule = openPorts.find(portRule => portRule.id === id);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
        // Put API call
    };

    const handleChangeActivation = () => {
        openPorts = openPorts.find(r => r.id === id);
        openPorts.isActive = !openPorts.isActive;
        setOpenPorts(openPorts);
    };

    const handleDelete = () => {
        const newOpenPorts = openPorts.filter(r => r.id !== id);
        setOpenPorts(newOpenPorts);
    };

    return (
        <div>
            <IconButton
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleChangeActivation}>{portRule.isActive ? "Desactiver" : "Activer"}</MenuItem>
                <MenuItem onClick={handleDelete}>Supprimer</MenuItem>
            </Menu>
        </div>
    );
}
