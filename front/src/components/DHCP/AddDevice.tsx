import AddIcon from '@mui/icons-material/Add';
import { Button, Dialog, DialogTitle, List, ListItem, TextField, Typography } from "@mui/material";
import { Api } from "../../utils/Api";
import React from 'react'
import "./TableDevices.css";

interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
    setRefreshKey: (boolean) => void;
}

const AddDialog = ({ onClose, open, setRefreshKey }: SimpleDialogProps) => {
    return (
        <Dialog onClose={onClose} open={open}>
            <DialogTitle>Ajouter règle DHCP</DialogTitle>
            <DialogContent onClose={onClose} setRefreshKey={setRefreshKey} />
        </Dialog>
    );
};

const DialogContent = ({ onClose, setRefreshKey }) => {
    const [ipEdit, setIpEdit] = React.useState<string>("");
    const [macEdit, setMacEdit] = React.useState<string>("");
    const [descEdit, setDescEdit] = React.useState<string>("");
    const [nameEdit, setNameEdit] = React.useState<string>("");

    //TODO: check if mac already exist
    const handleSave = () => {
        Api.addDHCPLease({
            mac: macEdit,
            name: nameEdit,
            ip: ipEdit,
            description: descEdit
        });
        onClose();
        setRefreshKey((x) => x + 1);
    };

    return (
        <>
            <List sx={{ pt: 0 }}>
                <ListItem>
                    <TextField
                        className="dhcp-dialog-input"
                        value={nameEdit}
                        label='Name'
                        onChange={(e) => {
                            setNameEdit(e.target.value);
                        }}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        className="dhcp-dialog-input"
                        label="MAC"
                        value={macEdit}
                        onChange={(e) => {
                            setMacEdit(e.target.value);
                        }}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        className="dhcp-dialog-input"
                        value={ipEdit}
                        label="IP"
                        onChange={(e) => {
                            setIpEdit(e.target.value);
                        }}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        className="dhcp-dialog-input"
                        value={descEdit}
                        label="Description"
                        onChange={(e) => {
                            setDescEdit(e.target.value);
                        }}
                        multiline={true}
                    />
                </ListItem>
            </List>
            <div className="dhcp-dialog-button">
                <Button variant="outlined" style={{ marginRight: "10px" }} onClick={onClose}>
                    <Typography>Annuler</Typography>
                </Button>
                <Button variant="contained" onClick={handleSave}>
                    <Typography>Ajouter</Typography>
                </Button>
            </div>

        </>
    );
};

interface AddDeviceProps {
    setRefreshKey: (number) => void;
}

function AddDevice({ setRefreshKey }: AddDeviceProps) {
    const [open, setOpen] = React.useState(false);
    return (
        <div>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
                Ajouter
            </Button>
            <AddDialog onClose={() => setOpen(false)} open={open} setRefreshKey={setRefreshKey} />
        </div>
    )
}

export default AddDevice;
