import * as React from 'react';
import TablePorts from './TablePorts';
import AddPort from './AddPort';
import { PortRule } from '../../utils/types';
import { Api } from "../../utils/Api";
import { useEffect } from 'react';

export function Ports(){

    const [openPorts, setOpenPorts] = React.useState<PortRule[]>([]);
    const [refreshKey, setRefreshKey] = React.useState<number>(0);
    useEffect(() => {
        Api.fetchOpenPorts().then((openPorts) => {
            setOpenPorts(openPorts)
        })
    }, [refreshKey]);
    return (
        <div>
            <h1 style={{ float: "left", marginLeft: "25px" }}>
                Configuration des ports
            </h1>
            <div style={{ float: "right", marginTop: "60px", marginRight: "25px" }}>
                <AddPort setRefreshKey={setRefreshKey} />
            </div>
            
            <TablePorts openPorts={openPorts} setOpenPorts={setOpenPorts}></TablePorts>
        </div>
    )
}



