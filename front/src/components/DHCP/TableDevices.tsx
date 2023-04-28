import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import { DHCPLease } from "../../utils/types";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import "./TableDevices.css";
import DHCPDialog from "./DHCPDialog";
import { Api } from "../../utils/Api";


interface TableDeviceProps {
    rows: DHCPLease[];
    setRefreshKey: (boolean) => void;
}

let selectedId = -1;

export function TableDevices({ rows, setRefreshKey }: TableDeviceProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <div id="table-user" style={{ margin: "0 20px" }}>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    <div className="device-name">{row.name}</div>
                                    <div className="device-address">
                                        <div>{row.mac}</div>
                                        <div>{row.ip}</div>
                                    </div>

                                </TableCell>
                                <TableCell style={{ width: 360 }} align="right">
                                    {row.description}
                                </TableCell>
                                <TableCell style={{ width: 120 }} align="right">
                                    <IconButton aria-label="Modifier" onClick={() => {
                                        console.log(row.mac);
                                        selectedId = row.id;
                                        setOpen(true);
                                    }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton aria-label="Supprimer" onClick={() => {
                                        Api.deleteDHCPLease(row.id);
                                        setRefreshKey((x) => x + 1);
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <DHCPDialog open={open} onClose={() => setOpen(false)} id={selectedId} setRefreshKey={setRefreshKey} />
        </div>
    );
}
