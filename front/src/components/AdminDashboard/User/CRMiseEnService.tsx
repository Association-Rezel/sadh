import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { CommandeAccesInfo, CRMiseEnService, ONT, UserDataBundle } from '../../../utils/types';
import { DialogActions, TextField } from '@mui/material';
import { Api } from '../../../utils/Api';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

export interface CRMESDialogProps {
    open: boolean;
    onClose: () => void;
    userBundle: UserDataBundle;
}

export interface CSVFile {
    filename: string;
    content: string;
}


export default function CRMESDialog({ open, onClose, userBundle }: CRMESDialogProps) {
    const [hasONT, setHasONT] = useState<boolean>(false);

    const { register, handleSubmit, getValues, reset } = useForm<CRMiseEnService>({
        defaultValues: {
            ref_interne_rezel_commande: "",
            ref_pto: "",
            ref_prestation: "",
            date_mise_en_service: "",
        }
    });

    useEffect(() => {
        if (!userBundle?.subscription) return;

        Api.fetchONT(userBundle.user.keycloak_id).then((ont: ONT) => {
            setHasONT(ont !== null);
            if (ont === null) return;

            const splitName = userBundle.user.name.split(" ");
            reset({
                ref_interne_rezel_commande: "",
                ref_pto: "",
                ref_prestation: "",
                date_mise_en_service: "",
            });
        })
    }, [userBundle]);

    const sendData = (info: CRMiseEnService) => {
        Api.sendCRMiseEnService(info).then((res) => {
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
            {hasONT && (
                <>
                    <DialogTitle>Récapitulatif du CR MES</DialogTitle>
                    <List sx={{ pt: 0 }}>
                        {Object.keys(getValues()).map((key: keyof CRMiseEnService) => (
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
            {!hasONT && (
                <DialogTitle>Vous devez d'abord assigner un ONT</DialogTitle>
            )}
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>Annuler</Button>
                <Button variant="contained" type="submit">Télécharger le CSV</Button>
            </DialogActions>
        </form>
        </Dialog>
    );
}

