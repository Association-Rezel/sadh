import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Typography, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Chip, Alert } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AttachedWifiAdherent, User } from '../../../../utils/types/types';
import { Api } from '../../../../utils/Api';
import dayjs from 'dayjs';

interface DayJSAwareAttachedWifiAdherent {
    from_date: dayjs.Dayjs;
    to_date?: dayjs.Dayjs;
    user_id: string;
    comment: string;
}

const AttachedAdherents = ({ user, setUser }: { user: User, setUser: any }) => {
    const [UUIDToName, setUUIDToName] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);
    const { formState, control, handleSubmit, reset, getValues } = useForm<{ adherents: DayJSAwareAttachedWifiAdherent[] }>();

    useEffect(() => {
        reset({
            adherents: user.membership?.attached_wifi_adherents.map(adherent => ({
                ...adherent,
                from_date: dayjs(adherent.from_date),
                to_date: adherent.to_date ? dayjs(adherent.to_date) : undefined
            })) || []
        });
    }, [user]);

    useEffect(() => {
        Api.fetchUsers().then(users => {
            const uuidToName: { [key: string]: string } = {};
            users.forEach(user => {
                uuidToName[user.id] = `${user.first_name} ${user.last_name}`;
            });
            setUUIDToName(uuidToName);
        }).catch(alert);
    }, []);

    const switchEditing = () => {
        if (isEditing) {
            reset();
        }
        setIsEditing(!isEditing);
    }

    const onSubmit = (data) => {
        Api.updateMembership(user.id, {
            attached_wifi_adherents: data.adherents.map(adherent => ({
                ...adherent,
                from_date: adherent.from_date.toDate(),
                to_date: adherent.to_date?.toDate() || null
            }))
        }).then(updatedUser => {
            setUser(updatedUser);
            switchEditing();
        }).catch(alert);
    };

    const handleAddRow = () => {
        reset((prev) => ({
            adherents: [...prev.adherents, { from_date: dayjs(), to_date: null, user_id: '', comment: '' }]
        }));
    };

    const handleDeleteRow = (index) => {
        reset((prev) => ({
            adherents: prev.adherents.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="mt-5">
            <div className="flex flex-col items-start mt-4">
                <Typography variant="h6" align="left" color="text.primary" component="div">
                    Adhérents Wi-Fi sur la box
                </Typography>
                {isEditing && (
                    <Button variant="contained" size="small" color="success" onClick={handleSubmit(onSubmit)}>
                        Enregistrer
                    </Button>
                )}
                {formState.errors.adherents && <Alert severity="error">La date de début et la UUID doivent être remplis pour toutes les entrées</Alert>}
                <TableContainer component={Paper}>
                    <Table size="small" aria-label="a dense table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Depuis le</TableCell>
                                <TableCell>Jusqu'au</TableCell>
                                <TableCell>{isEditing ? "UUID" : "Nom"}</TableCell>
                                <TableCell>Commentaire</TableCell>
                                {isEditing && <TableCell>Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getValues().adherents && getValues().adherents.map((adherent, index) => (
                                <TableRow key={adherent.user_id + adherent.from_date.toISOString() + adherent.to_date?.toISOString()}>
                                    <TableCell>
                                        {isEditing ? (
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                                                <Controller
                                                    name={`adherents.${index}.from_date`}
                                                    control={control}
                                                    rules={{ required: true }}
                                                    render={({ field }) => (
                                                        <DatePicker
                                                            {...field}
                                                            label="Depuis le"
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        ) : adherent.from_date.format("DD/MM/YYYY")}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                                                <Controller
                                                    name={`adherents.${index}.to_date`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DatePicker
                                                            {...field}
                                                            label="Jusqu'au (ou vide)"
                                                        />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        ) : adherent.to_date?.format("DD/MM/YYYY") ?? <Chip label="En cours" />}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Controller
                                                name={`adherents.${index}.user_id`}
                                                control={control}
                                                rules={{ required: true }}
                                                render={({ field }) => <TextField {...field} />}
                                            />
                                        ) : UUIDToName[adherent.user_id] || adherent.user_id}
                                    </TableCell>
                                    <TableCell>
                                        {isEditing ? (
                                            <Controller
                                                name={`adherents.${index}.comment`}
                                                control={control}
                                                render={({ field }) => <TextField {...field} multiline minRows={3} />}
                                            />
                                        ) : adherent.comment}
                                    </TableCell>
                                    {isEditing && (
                                        <TableCell>
                                            <Button variant="outlined" size="small" onClick={() => handleDeleteRow(index)}>
                                                Supprimer
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {isEditing && (
                    <Button variant="outlined" size="small" onClick={handleAddRow} sx={{ marginTop: 2 }}>
                        + Ajouter une ligne
                    </Button>
                )}
                <div className='mt-8'>
                    <Button variant="outlined" size="small" onClick={switchEditing}>
                        {isEditing ? 'Annuler' : 'Modifier'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AttachedAdherents;