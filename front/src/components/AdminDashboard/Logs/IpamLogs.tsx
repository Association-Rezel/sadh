import { useContext, useEffect, useState } from "react";
import { Button, CircularProgress, Collapse, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import dayjs, { Dayjs } from 'dayjs';
import { IpamLog } from "../../../utils/types/log_types";
import { Controller, useForm } from "react-hook-form";
import { AppStateContext } from "../../../utils/AppStateContext";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Transition, TransitionGroup } from 'react-transition-group';

type CreateLogForm = {
    message: string;
    source: string;
}

type SearchLogForm = {
    start: Dayjs;
    end: Dayjs;
}

export default function IpamLogs() {
    const [logs, setLogs] = useState<IpamLog[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentSearchString, setCurrentSearchString] = useState<string>("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    const { appState } = useContext(AppStateContext);

    const filteredLogs = logs?.filter(log => log.message.includes(currentSearchString));

    const createLogForm = useForm<CreateLogForm>({
        defaultValues: {
            message: "",
            source: "manual (" + appState?.user?.first_name + " " + appState?.user?.last_name + ")"
        }
    });

    const searchLogsForm = useForm<SearchLogForm>({
        defaultValues: {
            start: dayjs().subtract(1, 'month'),
            end: dayjs(),
        }
    });

    const handleSubmitCreateLog = async () => {
        try {
            await Api.createIpamLog(createLogForm.getValues().message, createLogForm.getValues().source);
            loadLogs();
        } catch (error) {
            alert(error.message);
        }
    }

    const loadLogs = async () => {
        setLoading(true);
        try {
            const logs = await Api.fetchIpamLogs(
                searchLogsForm.getValues().start.toDate(),
                searchLogsForm.getValues().end.toDate());
            setLogs(logs);
        } catch (error) {
            alert(error.message);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <div className="col-span-3 flex flex-col mt-16">
                <div className="mb-12">
                    <Typography
                        variant="h2"
                        align="center"
                        color={"text.primary"}
                    >
                        IPAM Logs
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                    >
                        Rezel est légalement tenu d'être en mesure de fournir des
                        informations aux autorités sur l'utilisateur d'une adresse IP à un
                        moment donné. Cette page répertorie les logs liés à l'attribution
                        des IPv4 et blocs IPv6.
                    </Typography>
                </div>
                <Typography
                    variant="h5"
                    color="text.primary"
                    align="left"
                >
                    Ajouter un log
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    align="left"
                >
                    Peut être utile pour des actions manuelles sur la base de
                    données ou pour ajouter du contexte sur une ressource à un instant donné.
                </Typography>
                <form className="flex flex-row gap-12 items-end min-w-max" onSubmit={createLogForm.handleSubmit(handleSubmitCreateLog)}>
                    <Controller
                        name="source"
                        control={createLogForm.control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Source"
                                variant="standard"
                                sx={{ minWidth: "15rem" }}
                            />
                        )}
                    />
                    <Controller
                        name="message"
                        control={createLogForm.control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Message"
                                variant="standard"
                                rows={2}
                                multiline
                                fullWidth
                                required
                            />
                        )}
                    />
                    <Button type="submit" variant="outlined" disabled={createLogForm.formState.isSubmitting} sx={{ minWidth: "10rem" }}>
                        Créer ⚠️
                    </Button>
                </form>
            </div>
            <div>
                <Typography
                    variant="h5"
                    color="text.primary"
                    align="left"
                >
                    Période
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    align="left"
                >
                    Période à charger auprès de la base de données
                </Typography>
            </div>
            <div className="flex flex-row gap-12 items-center">
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                    <Controller
                        name="start"
                        control={searchLogsForm.control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="Du"
                                slotProps={{ textField: { variant: "standard" } }}
                            />
                        )}
                    />
                    <Controller
                        name="end"
                        control={searchLogsForm.control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="au"
                                slotProps={{ textField: { variant: "standard" } }}
                            />
                        )}
                    />
                </LocalizationProvider>
                <Button onClick={loadLogs} variant="outlined">Charger</Button>
            </div>
            <div>
                <Typography
                    variant="h5"
                    color="text.primary"
                    align="left"
                >
                    Recherche
                </Typography>
                <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    align="left"
                >
                    Rechercher (côté client, dans le navigateur) une chaine de caractères dans les logs
                </Typography>
            </div>

            <div className="flex flex-row gap-12 items-center">
                <TextField
                    label="Texte à inclure"
                    variant="standard"
                    onChange={(e) => setCurrentSearchString(e.target.value)}
                />
            </div>

            {loading || createLogForm.formState.isSubmitting ? <CircularProgress /> : null}
            {filteredLogs &&
                <>
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Message</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLogs.map(log => (
                                    <TableRow
                                        key={log.timestamp + log.source + log.message}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        className="transition-all duration-200 ease-in-out hover:bg-gray-100"
                                    >
                                        <TableCell>
                                            {dayjs(log.timestamp).format("DD/MM/YYYY HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>{log.source}</TableCell>
                                        <TableCell>{log.message}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[50, 500, 1000]}
                        component="div"
                        count={filteredLogs.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => setRowsPerPage(parseInt(event.target.value, 10))}
                    />
                </>
            }
        </div>
    );
};