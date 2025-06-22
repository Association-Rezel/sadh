import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import { DepositStatus, MembershipStatus, MembershipType, User } from "../../utils/types/types";
import { Link } from "react-router-dom";
import MembershipTypeChip from "../utils/Utils";
import { TableHead, TableSortLabel } from "@mui/material";
import SelectableTableCell from "../utils/SelectableTableCell";

interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label="first page">
                {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
                {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
}

export function TableUsers({ users,
    tableHead = false,
    rowsPerPageOptions = [5, 10, 25, { label: "All", value: -1 }],
    rowsPerPageDefault = 5 }: {
        users: User[],
        tableHead?: boolean,
        rowsPerPageOptions?: Array<number | { value: number; label: string }>,
        rowsPerPageDefault?: number
    }) {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(rowsPerPageDefault);
    
    const [shownUsers, setShownUsers] = React.useState<User[]>([]);

    const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

    const possibleFieldsType = ["(Vide)", ...Object.values(MembershipType)] as string[];
    const [selectedFieldsType, setSelectedFieldsType] = React.useState<string[]>(possibleFieldsType);
    
    const possibleFieldsStatus = ["(Vide)", ...Object.values(MembershipStatus).filter((status) => typeof status === "string")] as string[];
    const defaultDisabledStatus = ["INACTIVE"];
    const [selectedFieldsStatus, setSelectedFieldsStatus] = React.useState<string[]>(possibleFieldsStatus.filter((status) => !defaultDisabledStatus.includes(status)));

    const [selectedFieldsDeposit, setSelectedFieldsDeposit] = React.useState<string[]>(["Oui", "Non"]);
    const possibleFieldsDeposit = ["Oui", "Non"];

    const [selectedFieldsFirstMonth, setSelectedFieldsFirstMonth] = React.useState<string[]>(["Oui", "Non"]);
    const possibleFieldsFirstMonth = ["Oui", "Non"];

    const [selectedFieldsContract, setSelectedFieldsContract] = React.useState<string[]>(["Oui", "Non"]);
    const possibleFieldsContract = ["Oui", "Non"];

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - shownUsers.length) : 0;

    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const usersSorting = () => {
        shownUsers.sort((a, b) => {
            if (sortDirection === "asc") {
                return a.first_name.localeCompare(b.first_name);
            } else {
                return b.first_name.localeCompare(a.first_name);
            }
        });
    };

    React.useEffect(() => {
        usersSorting();
    }, [sortDirection, shownUsers]);
    usersSorting();

    React.useEffect(() => {
        if (!tableHead) {
            setShownUsers(users);
            return;
        }
        // Filter users based on selected fields
        const filteredUsers = users.filter((user) => {
            const typeMatch = selectedFieldsType.includes(user.membership?.type) || (selectedFieldsType.includes("(Vide)") && !user.membership?.type);
            const statusMatch = selectedFieldsStatus.includes(MembershipStatus[user.membership?.status]) || (selectedFieldsStatus.includes("(Vide)") && !user.membership?.status);
            const depositMatch = selectedFieldsDeposit.includes(user.membership?.deposit_status === DepositStatus.PAID ? "Oui" : "Non");
            const firstMonthMatch = selectedFieldsFirstMonth.includes(user.membership?.paid_first_month ? "Oui" : "Non");
            const contractMatch = selectedFieldsContract.includes(user.membership?.contract_signed ? "Oui" : "Non");

            return typeMatch && statusMatch && depositMatch && firstMonthMatch && contractMatch;
        });
        setPage(0);
        setShownUsers(filteredUsers);
    }, [selectedFieldsType, selectedFieldsStatus, selectedFieldsDeposit, selectedFieldsFirstMonth, selectedFieldsContract, users]);


    return (
        <div id="table-user" style={{ margin: "0 20px" }}>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
                    {tableHead ?
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active={true}
                                        direction={sortDirection}
                                        onClick={() => {
                                            const newDirection = sortDirection === "asc" ? "desc" : "asc";
                                            setSortDirection(newDirection);
                                        }}
                                        >Prénom Nom</TableSortLabel>
                                </TableCell>
                                <SelectableTableCell selectedFields={selectedFieldsType} possibleFields={possibleFieldsType} onChange={setSelectedFieldsType}>
                                    Type d'adhésion
                                </SelectableTableCell>
                                <SelectableTableCell selectedFields={selectedFieldsStatus} possibleFields={possibleFieldsStatus} onChange={setSelectedFieldsStatus}>
                                    Statut d'adhésion
                                </SelectableTableCell>
                                <SelectableTableCell selectedFields={selectedFieldsDeposit} possibleFields={possibleFieldsDeposit} onChange={setSelectedFieldsDeposit}>
                                    Caution payé
                                </SelectableTableCell>
                                <SelectableTableCell selectedFields={selectedFieldsFirstMonth} possibleFields={possibleFieldsFirstMonth} onChange={setSelectedFieldsFirstMonth}>
                                    1er mois payé
                                </SelectableTableCell>
                                <SelectableTableCell selectedFields={selectedFieldsContract} possibleFields={possibleFieldsContract} onChange={setSelectedFieldsContract}>
                                    Contrat signé
                                </SelectableTableCell>
                            </TableRow>
                        </TableHead>
                    : null}
                    <TableBody>
                        {(rowsPerPage > 0
                            ? shownUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            : shownUsers
                        ).map((user: User) => (
                            <TableRow key={user.id}>
                                <TableCell component="th" scope="row">
                                    <Link to={"/admin/users/" + user.id}>
                                        {user.first_name} {user.last_name}
                                    </Link>
                                </TableCell>
                                <TableCell align="right">
                                    <MembershipTypeChip type={user.membership?.type} />
                                </TableCell>
                                <TableCell align="right">
                                    {MembershipStatus[user.membership?.status]}
                                </TableCell>
                                <TableCell align="right">
                                    {user.membership?.deposit_status == DepositStatus.PAID ? <p className="text-green-700">Caution</p> : <p className="text-red-700">Caution</p>}
                                </TableCell>
                                <TableCell align="right">
                                    {user.membership?.paid_first_month ? <p className="text-green-700">1er mois</p> : <p className="text-red-700">1er mois</p>}
                                </TableCell>
                                <TableCell align="right">
                                    {user.membership?.contract_signed ? <p className="text-green-700">Contrat</p> : <p className="text-red-700">Contrat</p>}
                                </TableCell>
                            </TableRow>
                        ))}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell colSpan={6} />
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={rowsPerPageOptions}
                                colSpan={5}
                                count={shownUsers.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                SelectProps={{
                                    inputProps: {
                                        "aria-label": "rows per page",
                                    },
                                    native: true,
                                }}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                ActionsComponent={TablePaginationActions}
                                sx={{
                                    ".MuiTablePagination-displayedRows": {
                                        color: "gray"
                                    },
                                    ".MuiTablePagination-selectLabel": {
                                        color: "gray"
                                    }
                                }}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
        </div>
    );
}
