import { useEffect, useState } from "react";
import { Button, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Warning } from "@mui/icons-material";
import { Box } from "../../../utils/types/hermes_types";

export default function BoxSection({
    user_id }: {
        user_id: string
    }) {

    const [box, setBox] = useState<Box>();
    const [boxStillLoading, setBoxStillLoading] = useState<boolean>(true);
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
        setBoxStillLoading(true);
        Api.registerUserBox(user_id, boxType, macAddress, isTelecomian).then(box => {
            setBox(box);
            setBoxStillLoading(false);
        }).catch(e => {
            alert("Erreur lors de l'assignation de la box : " + e);
            setBoxStillLoading(false);
        });
    }

    useEffect(() => {
        Api.fetchUserBox(user_id).then(box => {
            setBox(box);
            setBoxStillLoading(false);
        });
    }, [user_id]);

    const [maskedPsk, setMaskedPsk] = useState("**********");

    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Box
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {(boxStillLoading) && <p>Chargement...</p>}

                {!boxStillLoading && !box && (
                    <Stack direction={"column"}
                        spacing={2}>
                        <FormControlLabel control={<Checkbox checked={isTelecomian} />}
                            label={<span>IP Télécomienne <Warning /></span>}
                            onChange={() => setIsTelecomian(!isTelecomian)}
                        />
                        <FormControl>
                            <InputLabel id="boxtype-label">Type de box</InputLabel>
                            <Select
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

                {!boxStillLoading && box && (
                    <>
                        <strong>MAC</strong> : {box.mac}<br />
                        <strong>IPv4 WAN</strong> : {main_unet.network.wan_ipv4.ip}<br />
                        <strong>IPv6 WAN</strong> : {main_unet.network.wan_ipv6.ip}<br />
                        <strong>SSID</strong> : {main_unet.wifi.ssid}<br />
                        <strong>PSK</strong> : {maskedPsk}<br />
                        <Button onClick={() => setMaskedPsk(main_unet.wifi.psk)}>Afficher PSK</Button>
                    </>
                )}
            </Typography>
        </div>
    )
}