import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Device } from "../../utils/types";
import OptionMenu from "./OptionMenu";


interface TableDeviceProps {
    rows: Device[];
}

let selectedMac = "";

export function TableConnectedDevices({ rows }: TableDeviceProps) {

    return (
        <div id="table-user" style={{ margin: "0 20px" }}>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                    <TableBody>
                        {(rows).map((row) => (
                            <TableRow key={row.name}>
                                <TableCell component="th" scope="row">
                                    <div className="device-name">{row.name}</div>
                                    <div className="device-address">
                                        <div>{row.mac}</div>
                                        <div>{row.ip}</div>
                                    </div>

                                </TableCell>
                                <TableCell style={{ width: 50 }} align="right">
                                    <OptionMenu/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    
                </Table>
            </TableContainer>
        </div>
    );
}
