import { useEffect, useState } from "react";
import Api from "../../../utils/Api";
import { Alert, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, Tooltip, IconButton, InputAdornment  } from "@mui/material";
import { ONTInfo, PMInfo, RegisterONT } from "../../../utils/types/pon_types";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import TrashIcon from '@mui/icons-material/Delete';
import { Box } from "../../../utils/types/hermes_types";
import ConfirmableButton from "../../utils/ConfirmableButton";
import { QrCodeScanner } from "@mui/icons-material";
import QRCodeScannerDialogZbar from "./QRCodeScannerDialog_zbar";

export default function ONTSection(
    {
        user_id,
        ont,
        setONT,
        box,
        ontLoading,
        setONTLoading,
    }: {
        user_id: string,
        ont: ONTInfo | null,
        setONT: (ont: ONTInfo | null) => void,
        box: Box | null,
        ontLoading: boolean,
        setONTLoading: (loading: boolean) => void,
    }) {
    const { register, handleSubmit, getValues, reset, control, setValue } = useForm<RegisterONT>({
        defaultValues: {
            serial_number: "",
            software_version: "3FE45655AOCK88",
            pm_id: "",
            position_pm: "",
        }
    });

    const [pms, setPms] = useState<PMInfo[] | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);

    const onSubmit: SubmitHandler<RegisterONT> = (register: RegisterONT) => {
        if (!box) {
            alert("Veuillez d'abord assigner une box");
            return;
        }
        //Check not empty 
        if (!register.serial_number || !register.software_version) {
            alert("Veuillez remplir tous les champs");
            return;
        }
        // Check serial format
        if (!register.serial_number.match(/^[A-Za-z]{4}:[0-9A-Fa-f]{8}$/)) {
            alert("Le numéro de série doit être de la forme ABCD:1A2B3C4D");
            return;
        }
        // Check PM not null
        if (!register.pm_id) {
            alert("Veuillez choisir un PM");
            return;
        }

        setONTLoading(true);
        Api.registerONT(user_id, register).then(ont => {
            setONT(ont);
        }).catch(e => {
            alert("Erreur lors de l'assignation de l'ONT : " + e);
        }).finally(() => {
            setONTLoading(false);
        });
    }

    const onDelete = () => {
        setONTLoading(true);
        Api.deleteONT(ont.serial_number).then(() => {
            setONT(null);
        }).catch(e => {
            alert("Erreur lors de la suppression de l'ONT : " + e);
        }).finally(() => {
            setONTLoading(false);
        });
    }

    const onForceRegisterInOLT = () => {
        setONTLoading(true);
        Api.forceOntRegistration(ont.serial_number).catch(e => {
            alert("Erreur lors du registering dans l'OLT : " + e);
        }).finally(() => {
            setONTLoading(false);
        });
    }

    const handleScanSuccess = (scannedValue: string) => {
        setValue('serial_number', scannedValue);
        setScannerOpen(false);
    };

    useEffect(() => {
        Api.fetchPMs().then(pms => {
            setPms(pms);
        });
    }, []);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                ONT
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {ontLoading && <p>Chargement...</p>}

                {!ontLoading && !ont && (
                    <div className="inline-flex flex-col gap-y-3 flex-wrap">
                        <Controller
                            name="serial_number"
                            control={control}
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <TextField
                                        className="bg-white flex-1"
                                        required
                                        label="Numéro de série ONT"
                                        {...field}
                                    />
                                    <IconButton
                                        onClick={() => setScannerOpen(true)}
                                        color="primary"
                                    >
                                        <QrCodeScanner />
                                    </IconButton>
                                </div>
                            )
                        }
                        
                        />

                        <Controller
                            name="position_pm"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    className="bg-white"
                                    label="Forcer une position PM"
                                    {...field}
                                />
                            )}
                        />

                        <Controller
                            name="pm_id"
                            control={control}
                            render={({ field }) => (
                                <FormControl>
                                    <InputLabel id="pm_id-label">PM</InputLabel>
                                    <Select
                                        className="bg-white"
                                        labelId="pm_id-label"
                                        id="pm_id-select"
                                        label="PM"
                                        {...field}
                                    >
                                        {pms && pms?.map(pm => (
                                            <MenuItem key={pm.id} value={pm.id}>{pm.description}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />

                        <TextField name="software_version"
                            className="bg-white"
                            required
                            label="Version du logiciel"
                            {...register("software_version")}
                        />

                        <Button variant="contained" onClick={handleSubmit(onSubmit)}>Assigner l'ONT</Button>
                    </div>
                )}

                {!ontLoading && ont && (
                    <>
                        <strong>Numéro de série</strong> : {ont.serial_number}<br />
                        <strong>Position au PM</strong> : {ont.mec128_position}<br />
                        <strong>PON Interface</strong> : {ont.olt_interface}<br />
                        <strong>PM</strong> : {ont.pm_description}<br />
                        <strong>Position porte droite</strong> : {ont.position_in_subscriber_panel}<br />
                        <Typography variant="h6" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                            Données opérationnelles
                        </Typography>
                        {ont.configured_in_olt == null &&
                            <Alert severity="warning">
                                Aucune donnée remontée par net-adh-scraper.
                                Soit l'ONT n'est pas enregistré dans l'OLT,
                                soit il faut attendre la prochaine éxécution
                                de net-adh-scraper (quelques minutes).
                            </Alert>}
                        {ont.configured_in_olt != null && !ont.configured_in_olt &&
                            <Alert severity="error">
                                L'ONT n'est pas enregistré dans l'OLT.
                                Vous pouvez forcer l'enregistrement ci-dessous.
                            </Alert>}
                        {ont.configured_in_olt && (() => {
                            const lastFetchedDate = new Date(ont.operational_data.last_fetched * 1000);
                            const isDataObsolete = new Date().getTime() - lastFetchedDate.getTime() > 6 * 60 * 60 * 1000;

                            return (
                                <>
                                    {/* Alerte qui s'affiche si les données sont vieilles de plus de 6h */}
                                    {isDataObsolete && (
                                        <Alert severity="warning" sx={{ my: 2 }}>
                                            Attention : La supervision semble obsolète. La dernière mise à jour des données date du {lastFetchedDate.toLocaleString('fr-FR')}.
                                        </Alert>
                                    )}

                                    au {lastFetchedDate.toLocaleDateString(navigator.language, { hour: 'numeric', minute: 'numeric' })}<br />
                                    <br />
                                    <strong>Etat administratif</strong> : {ont.operational_data.admin_status ?
                                        <Chip variant="outlined" color="success" label="Activé" />
                                        : <Chip color="error" label="Désactivé" />
                                    }
                                    <br />
                                    {ont.operational_data?.admin_status && (
                                        <>
                                            <strong>Réception du signal</strong> : {
                                                ont.operational_data.operational_status ?
                                                    <Chip variant="outlined" color="success" label="Oui" />
                                                    : <Chip color="error" label="Non" />
                                            }
                                            <br />
                                            <strong>Dernier signal reçu</strong> : {
                                                ont.operational_data.last_operational_up ?
                                                    new Date(ont.operational_data.last_operational_up * 1000).toLocaleDateString(navigator.language, { hour: 'numeric', minute: 'numeric' })
                                                    : "Jamais"
                                            }<br />
                                            <strong>Réception signal (dBm)</strong> : {ont.operational_data.dbm_level}<br />
                                            <strong>Distance estimée</strong> : {ont.operational_data.estimation_distance} km<br />
                                            <strong>OLT path</strong> : {ont.operational_data.path} <br />
                                        </>
                                    )}
                                    {!ont.operational_data?.admin_status &&
                                        <Alert severity="warning">
                                            L'ONT est désactivé administrativement dans l'OLT.
                                            Pour ré-activer, vous pouvez forcer le ré-enregistrement ci-dessous
                                        </Alert>}
                                    <br />
                                    {!ont.operational_data && <Chip color="error" label="Erreur. Etat innatendu (pas de données opérationelles)." />}
                                </>
                            )
                        })()}
                        <ConfirmableButton
                            variant="text"
                            buttonColor="error"
                            onConfirm={onDelete}
                            startIcon={<TrashIcon />}
                            confirmationText="Le déprovisionning de l'ONT est une action irreversible.
                                     Si vous souhaitez réutiliser ses informations, pensez à les notez au préalable.
                                     (numéro de série, position au PM, etc...)"
                        >
                            Supprimer l'ONT
                        </ConfirmableButton>
                        <Button variant="text" size="small" onClick={onForceRegisterInOLT}>Forcer ré-enregistrement OLT</Button>
                    </>
                )}
            </Typography>

            <QRCodeScannerDialogZbar
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanSuccess={handleScanSuccess}
                scanType="serial"
            />
        </div>
    )
}
