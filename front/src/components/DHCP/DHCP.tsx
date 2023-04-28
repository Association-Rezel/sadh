import { useEffect, useState } from 'react';
import { DHCPLease } from "../../utils/types";
import { Api } from "../../utils/Api";
import { TableDevices } from "./TableDevices";
import AddDevice from "./AddDevice";


export default function DHCP() {
    const [devices, setDevices] = useState<DHCPLease[]>([]);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    useEffect(() => {
        Api.fetchDHCPLeases().then((devices) => {
            setDevices(devices)
        })
    }, [refreshKey]);

    return (
        <div className="card">
            <h1 style={{ float: "left", marginLeft: "25px" }}>
                Configuration DHCP
            </h1>
            <div style={{ float: "right", marginTop: "60px", marginRight: "25px" }}>
                <AddDevice setRefreshKey={setRefreshKey} />
            </div>

            <TableDevices rows={devices} setRefreshKey={setRefreshKey} />
        </div>
    )
}


