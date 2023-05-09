import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import OptionMenu from './OptionMenu';


export default function DenseTable({openPorts, setOpenPorts, setRefreshKey}) {
    
    return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell width={"20%"}>Service</TableCell>
            <TableCell align="left" width={"20%"}>Port interne</TableCell>
            <TableCell align="left">Port Externe</TableCell>
            <TableCell align="left">Protocole</TableCell>
            <TableCell align="left">Status</TableCell>
            <TableCell align="center"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {openPorts.map((row) => (
            <TableRow
              key={row.service}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.service}
              </TableCell>
              <TableCell align="left">{row.internPort}</TableCell>
              <TableCell align="left">{row.externPort}</TableCell>
              <TableCell align="left">{row.protocol}</TableCell>
              <TableCell align="left">{row.isActive ? "Activé" : "Desactivé"}</TableCell>
              <TableCell align="left">
                <OptionMenu 
                    openPorts={openPorts} 
                    setOpenPorts={setOpenPorts} 
                    id={row.id}
                    setRefreshKey={setRefreshKey}
                    />
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

