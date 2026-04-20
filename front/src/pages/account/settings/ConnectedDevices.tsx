import { useEffect } from "react";
import { useState } from "react";

import { Table, TableHead, TableRow, TableCell, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import WarningIcon from "@mui/icons-material/WarningAmber";

import Api from "../../../utils/Api";
import { useAuthContext } from "../../auth/AuthContext";
import {
    ConnectedDevice,
    DeviceState,
} from "../../../utils/types/faistos_types";

export default function ConnectedDevices() {
    const appState = useAuthContext();

    const [connectedDevices, setConnectedDevices] = useState<
        ConnectedDevice[] | null
    >(null);

    useEffect(() => {
        Api.getMyConnectedDevices().then(setConnectedDevices);
    }, [appState.user.id]);

    if (connectedDevices === null) return <div>Chargement...</div>;

    return (
        <div>
            <h2>Mes appareils connectés</h2>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Hostname</TableCell>
                        <TableCell>MAC</TableCell>
                        <TableCell>IPv4</TableCell>
                        <TableCell>IPv6</TableCell>
                        <TableCell>Type de connexion</TableCell>
                        <TableCell>Utilise DHCP</TableCell>
                        <TableCell>État</TableCell>
                    </TableRow>
                </TableHead>
                {connectedDevices.map((device, index) => (
                    <TableRow key={index}>
                        <TableCell>{device.hostname}</TableCell>
                        <TableCell>{device.mac}</TableCell>
                        <TableCell>
                            <IPsList ips={device.ipv4s} />
                        </TableCell>
                        <TableCell>
                            <IPsList ips={device.ipv6s} />
                        </TableCell>
                        <TableCell>
                            {device.connection_type.type === "WIRED"
                                ? "Filaire"
                                : "Wi-Fi " +
                                  (device.connection_type.frequency || "")}
                        </TableCell>
                        <TableCell>{device.use_dhcp ? "Oui" : "Non"}</TableCell>
                        <TableCell>
                            <State state={device.state} />
                        </TableCell>
                    </TableRow>
                ))}
            </Table>
        </div>
    );
}

function IPsList({ ips }: { ips: string[] }) {
    if (ips.length === 0) return <p></p>;
    if (ips.length === 1) return <p>{ips[0]}</p>;

    return (
        <div style={{ textWrap: "nowrap" }}>
            {ips[0] + " "}
            <Tooltip title={"Autre IP(s): " + ips.slice(1).join(" ")}>
                <HelpOutlineIcon />
            </Tooltip>
        </div>
    );
}

function State({ state }: { state: DeviceState }) {
    if (state === DeviceState.CONNECTED) return <p>Connecté</p>;
    if (state === DeviceState.SOME_STALE)
        return (
            <div style={{ textWrap: "nowrap" }}>
                Connecté{" "}
                <Tooltip title="Certaines IPs ne sont peut-être plus connectées">
                    <WarningIcon />
                </Tooltip>
            </div>
        );

    return (
        <div style={{ textWrap: "nowrap" }}>
            Peut-être connecté{" "}
            <Tooltip title="L'appareil a été connecté récemment, mais ne l'est peut-être plus">
                <HelpOutlineIcon />
            </Tooltip>
        </div>
    );
}
