import { useEffect, useState } from "react";
import { Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Warning } from "@mui/icons-material";
import { Box } from "../../../utils/types/hermes_types";
import { ONTInfo } from "../../../utils/types/pon_types";
import TrashIcon from '@mui/icons-material/Delete';

export default function BoxSection(
    {
        user_id,
        ont,
        setBox,
        box,
        boxLoading,
        setBoxLoading,
    }: {
        user_id: string,
        ont: ONTInfo | null,
        setBox: (box: Box | null) => void,
        box: Box | null,
        boxLoading: boolean,
        setBoxLoading: (loading: boolean) => void,
    }) {
    const [boxType, setBoxType] = useState<string>("");
    const [macAddress, setMacAddress] = useState<string>("");
    const [isTelecomian, setIsTelecomian] = useState<boolean>(false);

    const main_unet = box?.unets.filter(u => u.unet_id === box.main_unet_id)[0];

    const handleSubmit = () => {
        //Check not empty 
        if (!boxType || !macAddress) {
            alert("Veuillez remplir tous les champs");
            return;
        }
        // Check MAC format
        if (!macAddress.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
            alert("Adresse MAC invalide");
            return;
        }
        setBoxLoading(true);
        Api.registerUserBox(user_id, boxType, macAddress, isTelecomian).then(box => {
            setBox(box);
            setBoxLoading(false);
        }).catch(e => {
            alert("Erreur lors de l'assignation de la box : " + e);
            setBoxLoading(false);
        });
    }

    const onDelete = () => {
        if (box.unets.length > 1) {
            alert("Vous ne pouvez pas supprimer la box tant que d'autres unets que le principal sont associés à cette box.");
            return;
        } else if (ont) {
            alert("Vous ne pouvez pas supprimer la box tant qu'un ONT est associé à cette box.");
            return;
        }

        setBoxLoading(true);
        Api.deleteBox(user_id).then(() => {
            setBox(null);
        }).catch(e => {
            alert("Erreur lors de la suppression de la box : " + e);
        }).finally(() => {
            setBoxLoading(false);
        });
    }

    useEffect(() => {
        Api.fetchUserBox(user_id).then(box => {
            setBox(box);
            setBoxLoading(false);
        });
    }, [user_id]);

    const [maskedPsk, setMaskedPsk] = useState("**********");

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Box
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {(boxLoading) && <p>Chargement...</p>}

                {!boxLoading && !box && (
                    <Stack direction={"column"}
                        spacing={2}>
                        <FormControlLabel control={<Checkbox checked={isTelecomian} />}
                            label={<span>IP Télécomienne <Warning /></span>}
                            onChange={() => setIsTelecomian(!isTelecomian)}
                        />
                        <FormControl>
                            <InputLabel id="boxtype-label">Type de box</InputLabel>
                            <Select
                                className="bg-white"
                                labelId="boxtype-label"
                                id="boxtype-select"
                                label="Type de box"
                                onChange={(e) => setBoxType(e.target.value as string)}
                            >
                                <MenuItem value="ac2350">AC 2350 (Box orange)</MenuItem>

                            </Select>
                        </FormControl>

                        <TextField name="mac_address"
                            className="bg-white"
                            required
                            label="Adresse MAC"
                            defaultValue={macAddress}
                            onChange={(e) => setMacAddress(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleSubmit}>Assigner la box</Button>
                    </Stack>
                )}

                {!boxLoading && box && (
                    <>
                        <strong>MAC</strong> : {box.mac}<br />
                        <strong>IPv4 WAN</strong> : {main_unet.network.wan_ipv4.ip}<br />
                        <strong>IPv6 WAN</strong> : {main_unet.network.wan_ipv6.ip}<br />
                        <strong>SSID</strong> : {main_unet.wifi.ssid}<br />
                        <strong>PSK</strong> : {maskedPsk}<br />
                        <Button onClick={() => setMaskedPsk(main_unet.wifi.psk)}>Afficher PSK</Button>
                        <Button color="error" onClick={onDelete} startIcon={<TrashIcon />}>Supprimer la box</Button>
                    </>
                )}
            </Typography>
        </div>
    )
}