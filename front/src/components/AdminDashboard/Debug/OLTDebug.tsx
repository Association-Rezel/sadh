import { useState } from "react";
import { Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Api } from "../../../utils/Api";

interface RowData {
    pon: string;
    ont: string;
    sernum: string;
    adminStatus: string;
    operStatus: string;
    oltRxSig: string;
    ontOlt: string;
    desc1: string;
    desc2: string;
    hostname: string;
}

export default function OLTDebug() {
    const [debugInfo, setDebugInfo] = useState<string>(null);
    const [loading, setLoading] = useState<boolean>(false);

    let tableData: RowData[] = [];

    if (debugInfo) {
        const lines = debugInfo.split('\\r\\n');
        const headerLine1Index = lines.findIndex(line => line.includes('|oper'));
        const headerLine2Index = lines.findIndex(line => line.includes('|level(dbm)'), headerLine1Index);
        const startIndex = headerLine2Index + 2; // Data starts 2 lines after the second header line
        const endIndex = lines.findIndex(line => line.startsWith('-----------------------------------------------------------------'), startIndex);

        if (headerLine1Index !== -1 && headerLine2Index !== -1 && endIndex !== -1) {
            // Combine header parts from both lines
            const headers1 = lines[headerLine1Index].split('|').map(h => h.trim());
            const headers2 = lines[headerLine2Index].split('|').map(h => h.trim());
            const headers = headers2.map((h2, i) => {
                if (h2 === '') {
                    return headers1[i]; // Use header from the first line if the second line is empty
                } else if (headers1[i] !== '') {
                    return `${headers1[i]} ${h2}`; // Combine headers if both lines have content
                }
                return h2;
            });

            const rows: RowData[] = [];
            for (let i = startIndex; i < endIndex; i++) {
                const values = lines[i]
                    .split(' ')
                    .filter(value => value !== '')
                    .map(value => value.trim());

                // Handle cases where fields might be empty or combined due to inconsistent spacing
                let row: any = {};
                let valueIndex = 0;
                headers.forEach(header => {
                    if (!["desc1", "desc2", "hostname"].includes(header)) {
                        row[header] = values[valueIndex++];
                    }
                });

                rows.push(row as RowData);
            }

            tableData = rows;
        }
    }

    const onClick = () => {
        setLoading(true);
        Api.fetchAllONTSummary().then(setDebugInfo).catch(alert).finally(() => setLoading(false));
    };

    return (
        <div className="flex flex-col gap-y-10 items-center">
            <h1>OLT Debug</h1>
            <Button variant="contained" onClick={onClick} disabled={loading}>
                Fetch all ONT summary
            </Button>
            {loading && <CircularProgress />}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            {Object.keys(tableData[0] || {}).map(key => (
                                <TableCell key={key}>{key}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tableData.map((row, index) => (
                            <TableRow
                                key={index}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {Object.values(row).map((value, index) => (
                                    <TableCell key={index} component="th" scope="row">
                                        {value}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div >
    );
};