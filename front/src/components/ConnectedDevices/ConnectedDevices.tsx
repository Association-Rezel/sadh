import { useEffect, useState } from 'react';
import { Device } from "../../utils/types";
import { Api } from "../../utils/Api";
import { TableConnectedDevices } from "./TableConnectedDevices";
import React from "react";



export default function ConnectedDevices() {
    const [devices, setDevices] = useState<Device[]>([]);
    
    useEffect(() => {
        Api.fetchConnectedDevices().then((devices) => {
            setDevices(devices)
        })
    }, []);

    return (
        <div className="card">
            <h1>Appareils connectés</h1>
            <TableConnectedDevices rows={devices} />
        </div>
    )
}


