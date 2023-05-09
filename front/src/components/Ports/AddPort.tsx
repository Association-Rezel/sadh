import AddIcon from '@mui/icons-material/Add';
import { Button, Dialog, DialogTitle, List, ListItem, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Api } from "../../utils/Api";
import React from 'react'
import "./AddPorts.css"

interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
    setRefreshKey: (boolean) => void;
}

const AddDialog = ({ onClose, open, setRefreshKey }: SimpleDialogProps) => {
    return (
        <Dialog onClose={onClose} open={open}>
            <DialogTitle>Ouvrir un port de votre Box</DialogTitle>
            <DialogContent onClose={onClose} setRefreshKey={setRefreshKey} />
        </Dialog>
    );
};

const DialogContent = ({ onClose, setRefreshKey }) => {
    const [serviceEdit, setServiceEdit] = React.useState<string>("");
    const [internPortEdit, setInternPortEdit] = React.useState<number>(null);
    const [externPortEdit, setExternPortEdit] = React.useState<number>(null);
    const [protocolEdit, setProtocolEdit] = React.useState<number>(0);

    const handleSave = () => {
        // generate unique id based on the date and time
        const id = new Date().getTime();
        Api.addOpenPort(
           {
                id,
                service: serviceEdit,
                internPort: internPortEdit,
                externPort: externPortEdit,
                protocol: protocolEdit ? "UDP" : "TCP",
                isActive: true,
           } 
        );
        setRefreshKey((x) => x + 1);
        onClose();
        
    };

    return (
        <>
            <List sx={{ pt: 0 }}>
                <ListItem>
                    <TextField
                        className="port-dialog-input"
                        value={serviceEdit}
                        label='Service'
                        onChange={(e) => {
                            setServiceEdit(e.target.value);
                        }}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        className="port-dialog-input"
                        label="Port interne"
                        value={internPortEdit}
                        type='number'
                        onChange={(e) => {
                            setInternPortEdit(+e.target.value);
                        }}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        className="port-dialog-input"
                        value={externPortEdit}
                        label="Port externe"
                        type='number'
                        onChange={(e) => {
                            setExternPortEdit(+e.target.value);
                        }}
                    />
                </ListItem>
              
                <Select
                    labelId="demo-select-small-label"
                    id="demo-select-small"
                    value={protocolEdit}
                    defaultValue={0}
                    label="TCP/UDP"
                    type='number'
                    onChange={(e) => {
                        setProtocolEdit(+e.target.value);
                    }}
                >
                    <MenuItem value="">
                    </MenuItem>
                    <MenuItem value={0}>TCP</MenuItem>
                    <MenuItem value={1}>UDP</MenuItem>
                    
                </Select>
            </List>

            <div className="port-dialog-button">
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

function AddPort({ setRefreshKey }: AddDeviceProps) {
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

export default AddPort;
