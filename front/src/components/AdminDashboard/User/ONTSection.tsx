import { useEffect, useState } from "react";
import { Api } from "../../../utils/Api";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { ONTInfo, PMInfo, RegisterONT } from "../../../utils/types/pon_types";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import TrashIcon from '@mui/icons-material/Delete';
import { Box } from "../../../utils/types/hermes_types";

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
    const { register, handleSubmit, getValues, reset, control } = useForm<RegisterONT>({
        defaultValues: {
            serial_number: "",
            software_version: "3FE45655AOCK88",
            box_mac_address: "",
            pm_id: ""
        }
    });

    const [pms, setPms] = useState<PMInfo[] | null>(null);

    const onSubmit: SubmitHandler<RegisterONT> = (register: RegisterONT) => {
        //Check not empty 
        if (!register.serial_number || !register.software_version) {
            alert("Veuillez remplir tous les champs");
            return;
        }
        // Check serial format
        if (!register.serial_number.match(/^ALCL:[0-9A-Fa-f]{8}$/)) {
            alert("Le numéro de série doit être de la forme ALCL:XXXXXXXX (13 chars)");
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
        Api.deleteONT(user_id).then(() => {
            setONT(null);
        }).catch(e => {
            alert("Erreur lors de la suppression de l'ONT : " + e);
        }).finally(() => {
            setONTLoading(false);
        });
    }

    useEffect(() => {
        Api.fetchPMs().then(pms => {
            setPms(pms);
        });
    }, []);

    // Prefill Box mac address if box is set
    useEffect(() => {
        if (getValues("box_mac_address")) return;
        if (box) {
            reset({ box_mac_address: box.mac });
        }
    }, [box]);


    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                ONT
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {ontLoading && <p>Chargement...</p>}

                {!ontLoading && !ont && (
                    <div className="inline-flex flex-col gap-y-3 flex-wrap">
                        <TextField name="box_mac_address"
                            className="bg-white"
                            required
                            label="Adresse MAC de la box"
                            {...register("box_mac_address")}
                        />

                        <TextField name="serial_number"
                            className="bg-white"
                            required
                            label="Numéro de série de l'ONT"
                            {...register("serial_number")}
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
                        <Button color="error" onClick={onDelete} startIcon={<TrashIcon />}>Supprimer l'ONT</Button>
                    </>
                )}
            </Typography>
        </div>
    )
}