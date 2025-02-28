import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { AnnulAccesInfo, User, MembershipStatus } from '../../../utils/types/types';
import { DialogActions, TextField } from '@mui/material';
import { Api } from '../../../utils/Api';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

export interface AnnulAccesDialogProps {
    open: boolean;
    onClose: () => void;
    user: User;
}

export interface CSVFile {
    filename: string;
    content: string;
}


export default function AnnulAccesDialog({ open, onClose, user }: AnnulAccesDialogProps) {
    const isPendingInactive = user.membership?.status === MembershipStatus.ACTIVE;

    const { register, handleSubmit, getValues, reset } = useForm<AnnulAccesInfo>({
        defaultValues: {
            ref_appartement: "",
            ref_interne_rezel_commande: "",
            residence: "",
            e_rdv: "",
            ref_pto: "",
            ref_prestation_prise: "",
            date_annulation: "",
            numero_sequence: ""
        }
    });

    useEffect(() => {
        if (!isPendingInactive) return;

        reset({
            residence: user.membership.address.residence,
            ref_interne_rezel_commande: user.membership.ref_commande,
            ref_appartement: user.membership.address.appartement_id,
            e_rdv: user.membership.erdv_id,
            ref_prestation_prise: user.membership.ref_prestation,
            date_annulation: dayjs(user.membership.appointment?.slot.end).format("YYYYMMDD HH:mm"),
            ref_pto: "",
            numero_sequence: "",
        });
    }, [user]);

    const sendData = (info: AnnulAccesInfo) => {
        Api.sendAnnulAcces(info).then((res) => {
            res.json().then((json) => {
                if (!res.ok) {
                    alert("Nix a retourné une erreur : \n" + JSON.stringify(json));
                    return;
                }
                else {
                    const fileContent = json.content;
                    const filename = json.filename;

                    // Create a Blob object containing the file content
                    const blob = new Blob([fileContent], { type: 'application/octet-stream' });

                    // Create a URL for the Blob
                    const url = window.URL.createObjectURL(blob);

                    // Create an <a> element to trigger the download
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;

                    // Trigger a click event on the <a> element
                    a.click();

                    // Clean up by revoking the Blob URL
                    window.URL.revokeObjectURL(url);
                 }
            });
        });
    }

    return (
        <Dialog onClose={onClose} open={open} maxWidth="sm" fullWidth={true}>
        <form onSubmit={handleSubmit(sendData)}>
            {isPendingInactive && (
                <>
                    <DialogTitle>Récapitulatif du ANNUL ACCES</DialogTitle>
                    <List sx={{ pt: 0 }}>
                        {Object.keys(getValues()).map((key: keyof AnnulAccesInfo) => (
                            <ListItem key={key} >
                                <TextField
                                    required={key !== "ref_pto"}
                                    label={key}
                                    {...register(key)}
                                    size='small'
                                    fullWidth={true} />
                            </ListItem>
                        ))}
                    </List>
                </>
            )}
            {!isPendingInactive && (
                <DialogTitle>Le status de l'adhérent n'est pas ACTIVE</DialogTitle>
            )}
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>Annuler</Button>
                <Button variant="contained" type="submit">Télécharger le CSV</Button>
            </DialogActions>
        </form>
        </Dialog>
    );
}

