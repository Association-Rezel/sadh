import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import { CommandeAccesInfo as CommandeAccesInfo, User } from '../../../utils/types/types';
import { DialogActions, TextField } from '@mui/material';
import { Api } from '../../../utils/Api';
import dayjs from 'dayjs';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { ONTInfos } from '../../../utils/types/pon_types';

export interface CmdAccesDialogProps {
    open: boolean;
    onClose: () => void;
    user: User;
}

export interface CSVFile {
    filename: string;
    content: string;
}


export default function CmdAccesDialog({ open, onClose, user }: CmdAccesDialogProps) {
    const [hasONT, setHasONT] = useState<boolean>(false);

    const { register, handleSubmit, getValues, reset } = useForm<CommandeAccesInfo>({
        defaultValues: {
            nom_adherent: "",
            prenom_adherent: "",
            email_adherent: "",
            telephone_adherent: "",
            residence: "",
            date_installation: "",
            e_rdv: "",
            pm_rack: "",
            pm_tiroir: "",
            pm_port: "",
            ref_interne_rezel_commande: "",
            ref_appartement: "",
            ref_pto: "",
            pto_existant: false,
            numero_sequence: ""
        }
    });

    useEffect(() => {
        if (!user?.membership?.appointment) return;

        Api.fetchONT(user.sub).then((ont: ONTInfos) => {
            setHasONT(ont !== null);
            if (ont === null) return;

            reset({
                nom_adherent: user.last_name,
                prenom_adherent: user.first_name,
                email_adherent: user.email,
                telephone_adherent: user.phone_number,
                residence: user.membership.address.residence,
                date_installation: dayjs(user.membership.appointment.slot.start).format("YYYYMMDD HH:mm"),
                e_rdv: user.membership.erdv_id,
                pm_rack: ont.pon_rack.toString(),
                pm_tiroir: ont.pon_tiroir.toString(),
                pm_port: ont.mec128_position,
                ref_interne_rezel_commande: user.membership.ref_commande,
                ref_appartement: user.membership.address.appartement_id,
                ref_pto: "",
                pto_existant: true,
                numero_sequence: ""
            });
        })
    }, [user]);

    const sendData = (info: CommandeAccesInfo) => {
        Api.sendCommandeAccesInfo(info).then((res) => {
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
                        <DialogTitle>Récapitulatif</DialogTitle>
                        <List sx={{ pt: 0 }}>
                            {Object.keys(getValues()).map((key: keyof CommandeAccesInfo) => (
                                <ListItem key={key} >
                                    {key !== "pto_existant" && (
                                        <TextField
                                            required={key !== "ref_pto"}
                                            label={key}
                                            {...register(key)}
                                            size='small'
                                            fullWidth={true} />
                                    )}
                                    {key === "pto_existant" && (
                                        <>
                                            <input type="checkbox" {...register(key)} />
                                            <p className="pl-2">PTO existant</p>
                                        </>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
                {!hasONT && (
                    <DialogTitle>Vous devez d'abord assigner un ONT et valider un créneau de rendez-vous</DialogTitle>
                )}
                <DialogActions>
                    <Button variant="outlined" onClick={onClose}>Annuler</Button>
                    <Button variant="contained" type="submit">Télécharger le CSV</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

