import { useEffect, useState } from "react";
import { Box, SubscriptionFlow } from "../../../utils/types";
import { Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Warning } from "@mui/icons-material";

export default function BoxSection({ keycloak_id, registerToSubFlowForm, currentSubFlow }: { keycloak_id: string, registerToSubFlowForm: any, currentSubFlow: SubscriptionFlow }) {

    const [box, setBox] = useState<Box>();
    const [boxStillLoading, setBoxStillLoading] = useState<boolean>(true);
    const [serial, setSerial] = useState<string>("");
    const [macAddress, setMacAddress] = useState<string>("");
    const [isTelecomian, setIsTelecomian] = useState<boolean>(false);

    const handleSubmit = () => {
        //Check not empty 
        if (!serial || !macAddress) {
            alert("Veuillez remplir tous les champs");
            return;
        }
        // Check MAC format
        if(!macAddress.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
            alert("Adresse MAC invalide");
            return;
        }
        setBoxStillLoading(true);
        Api.registerUserBox(keycloak_id, serial, macAddress, isTelecomian).then(box => {
            setBox(box);
            setBoxStillLoading(false);
        });
    }

    useEffect(() => {
        Api.fetchUserBox(keycloak_id).then(box => {
            setBox(box);
            setBoxStillLoading(false);
        });
    }, [keycloak_id]);


    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Box
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {(!currentSubFlow || boxStillLoading) && <p>Chargement...</p>}

                {currentSubFlow && !boxStillLoading && !box && (
                    <Stack direction={"column"}
                        spacing={2}>
                        <FormControlLabel control={<Checkbox checked={isTelecomian} />}
                            label={<span>IP Télécomienne <Warning /></span>}
                            onChange={() => setIsTelecomian(!isTelecomian)}
                        />
                        <TextField name="serial_number"
                            className="bg-white"
                            required
                            label="Numéro de série"
                            onChange={(e) => setSerial(e.target.value)}
                        />
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

                {currentSubFlow && !boxStillLoading && box && (
                    <>
                        <strong>Numéro de série</strong> : {box.serial_number}<br />
                        <strong>MAC</strong> : {box.if_mgmt.mac_address}<br />
                        <strong>IPs WAN</strong> : {[box.if_adh.ipv4s, box.if_adh.ipv6s, box.if_adh_exte.ipv4s, box.if_adh_exte.ipv6s].flat().join(", ")}<br />
                        <strong>IP mgt</strong> : {box.if_mgmt.ipv6s}<br />
                        <strong>SSID</strong> : {box.ssid}<br />
                        <strong>Informations</strong>
                        <div className="my-3">
                            <TextField multiline variant="outlined" className="bg-white w-80" minRows={3} {...registerToSubFlowForm("box_information")} />
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" {...registerToSubFlowForm("box_lent")} />
                            <strong className="pl-2">Box confiée à l'adhérent</strong>
                        </div>
                    </>
                )}
            </Typography>
        </div>
    )
}