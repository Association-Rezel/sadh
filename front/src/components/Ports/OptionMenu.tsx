
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import React from 'react';
import { PortRule } from '../../utils/types';
import { Api } from '../../utils/Api';
import { IconButton } from '@mui/material';


export default function OptionMenu({openPorts, setOpenPorts, id, setRefreshKey}) {

    const portRule : PortRule = openPorts.find(portRule => portRule.id === id);

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
        const newPortRule = newOpenPorts.find(r => r.id === id);
        // Not really clean but will be fixed in the TODO (copy openPorts is needed)
        newPortRule.isActive = !newPortRule.isActive;
        Api.setOpenPorts(newOpenPorts).then((r) => {
            setOpenPorts(newOpenPorts);
            setRefreshKey( (refreshKey) => refreshKey + 1);
        });
    }

    const handleDelete = () => {
        const newOpenPorts = openPorts.filter(r => r.id === id);
        Api.setOpenPorts(newOpenPorts).then((r) => {
            // setOpenPorts(newOpenPorts);
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
                <MenuItem onClick={handleChangeActivation}>{portRule.isActive ? "Desactiver" : "Activer"}</MenuItem>
                <MenuItem onClick={handleDelete}>Supprimer</MenuItem>
            </Menu>
        </>
    );
}
