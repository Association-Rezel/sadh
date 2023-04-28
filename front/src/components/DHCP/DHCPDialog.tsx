import { Button, Dialog, DialogTitle, List, ListItem, TextField, Typography } from "@mui/material";
import { Api } from "../../utils/Api";
import React, { useEffect } from 'react'
import "./TableDevices.css";

export interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
    id: number;
    setRefreshKey: (boolean) => void;
}

const DHCPDialog = ({ onClose, open, id, setRefreshKey }: SimpleDialogProps) => {
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle>Modifier règle DHCP</DialogTitle>
            <ButtonDHCP id={id} onClose={onClose} setRefreshKey={setRefreshKey} />
        </Dialog>
    );
};

const ButtonDHCP = ({ onClose, id, setRefreshKey }) => {
    const [ipEdit, setIpEdit] = React.useState<string>("");
    const [macEdit, setMacEdit] = React.useState<string>("");
    const [descEdit, setDescEdit] = React.useState<string>("");
    const [nameEdit, setNameEdit] = React.useState<string>("");

    useEffect(() => {
        Api.fetchDHCPLease(id).then((data) => {
            setIpEdit(data.ip);
            setMacEdit(data.mac);
            setDescEdit(data.description);
            setNameEdit(data.name);
        });
    }, []);

    //TODO: check if mac already exist
    const handleSave = () => {
        Api.deleteDHCPLease(id)
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
                    <Typography>Sauver</Typography>
                </Button>
            </div>

        </>
    );
};

export default DHCPDialog;
