import { useEffect, useState } from 'react';
import { Device } from "../../utils/types";
import { Api } from "../../utils/Api";
import { TableDevices } from "./TableDevices";



export default function DHCP() {
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        Api.fetchDevices().then((devices) => {
            setDevices(devices)
        })
    }, []);

    return (
        <div className="card">
            <h1>Devices</h1>
            <TableDevices rows={devices} />
        </div>
    )
}


