
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React from 'react';
import { PortRule } from '../../utils/types';
import { Api } from '../../utils/Api';
import { IconButton } from '@mui/material';


export default function OptionMenu({openPorts, setOpenPorts, port, setRefreshKey}) {

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // TODO : manage to change only the portRule that has been modified

    const handleChangeActivation = () => {
        const newOpenPorts = [...openPorts]
        const newPortRule = newOpenPorts[newOpenPorts.find((p) => p.id === port.id)] = !port.isActive;
        port.isActive = !port.isActive;
        // Not really clean but will be fixed in the TODO (copy openPorts is needed)
        Api.setOpenPort(port).then((r) => {
            setOpenPorts(newOpenPorts);
            setRefreshKey( (refreshKey) => refreshKey + 1);
        });
    }

    const handleDelete = () => {
        const newOpenPorts = []
        openPorts.forEach((p) => { if (p.id !== port.id) newOpenPorts.push(p); });
        Api.deleteOpenPort(port.id).then((r) => {
            setOpenPorts(newOpenPorts);
            setRefreshKey( (refreshKey) => refreshKey + 1);
        });
    }

    return (
        // option menu 
        <>
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
                <MenuItem onClick={handleChangeActivation}>{port.isActive ? "Desactiver" : "Activer"}</MenuItem>
                <MenuItem onClick={handleDelete}>Supprimer</MenuItem>
            </Menu>
        </>
    );
}
