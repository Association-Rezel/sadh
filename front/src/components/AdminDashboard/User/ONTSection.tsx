import { useEffect, useState } from "react";
import { ONT } from "../../../utils/types";
import { Api } from "../../../utils/Api";
import { Button, Checkbox, FormControlLabel, Stack, TextField, Typography } from "@mui/material";
import { Warning } from "@mui/icons-material";

export default function ONTSection({ keycloak_id, registerToSubFlowForm }: { keycloak_id: string, registerToSubFlowForm: any }) {

    const [ont, setONT] = useState<ONT>();
    const [ontStillLoading, setONTStillLoading] = useState<boolean>(true);
    const [serial, setSerial] = useState<string>("");
    const [softwareVersion, setSoftwareVersion] = useState<string>("3FE45655AOCK88");
    const [isTelecomian, setIsTelecomian] = useState<boolean>(false);

    const handleSubmit = () => {
        // serial is like ALCL:F887945B
        if (!serial || !serial.startsWith("ALCL:") || serial.length !== 13) {
            alert("Le numéro de série doit être de la forme ALCL:XXXXXXXX (13 chars)");
            return;
        }
        Api.registerONT(keycloak_id, serial, softwareVersion, isTelecomian).then(ont => {
            setONT(ont);
        });
    }

    useEffect(() => {
        Api.fetchONT(keycloak_id).then(ont => {
            setONT(ont);
            setONTStillLoading(false);
        });
    }, [keycloak_id]);


    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                ONT
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {ontStillLoading && <p>Chargement...</p>}

                {!ontStillLoading && !ont && (
                    <Stack direction={"column"}
                        spacing={2}>
                        <FormControlLabel control={<Checkbox checked={isTelecomian} />}
                            label={<span>VLAN Télécomien <Warning /></span>}
                            onChange={() => setIsTelecomian(!isTelecomian)}
                        />
                        <TextField name="serial_number"
                            className="bg-white"
                            required
                            label="Numéro de série"
                            onChange={(e) => setSerial(e.target.value)}
                        />
                        <TextField name="software_version"
                            className="bg-white"
                            required
                            label="Software version"
                            defaultValue={softwareVersion}
                            onChange={(e) => setSoftwareVersion(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleSubmit}>Assigner l'ONT</Button>
                    </Stack>
                )}

                {!ontStillLoading && ont && (
                    <>
                        <strong>Numéro de série</strong> : {ont.serial_number}<br />
                        <strong>Position au PM</strong> : {ont.position_PM}<br />
                        <strong>Netbox ID</strong> : {ont.netbox_id}<br />
                        <div className="flex items-center">
                            <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToSubFlowForm("ont_lent")} />
                            <strong className="pl-2">ONT confié à l'adhérent</strong>
                        </div>
                    </>
                )}
            </Typography>
        </div>
    )
}