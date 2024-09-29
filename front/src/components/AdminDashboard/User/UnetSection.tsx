import { useContext, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Chip, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Box, UnetProfile } from "../../../utils/types/hermes_types";
import { MembershipType, User } from "../../../utils/types/types";
import { Controller, set, useForm } from "react-hook-form";
import { ONTInfo } from "../../../utils/types/pon_types";
import TrashIcon from '@mui/icons-material/Delete';
import ConfirmableButton from "../../utils/ConfirmableButton";
import EditIcon from '@mui/icons-material/Edit';

type FormValues = {
    boxType?: string;
    macAddress: string;
    isTelecomian: boolean;
};

export default function UnetSection({
    user,
    ont,
    setBox,
    box,
    boxLoading,
    setBoxLoading,
}: {
    user: User,
    ont: ONTInfo | null,
    setBox: (box: Box | null) => void,
    box: Box | null,
    boxLoading: boolean,
    setBoxLoading: (loading: boolean) => void,
}) {
    const {
        getValues,
        handleSubmit,
        control,
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            boxType: "ac2350",
            macAddress: "",
            isTelecomian: false
        }
    });

    const [maskedPsk, setMaskedPsk] = useState("**********");
    const [editingMac, setEditingMac] = useState(false);
    const [newMac, setNewMac] = useState("");
    if (box && newMac === "") {
        setNewMac(box.mac);
    }

    const main_unet = box?.unets.filter(u => u.unet_id === box.main_unet_id)[0];
    let myUnetProfile: UnetProfile | null = null;
    let isMainUnet: boolean = false;
    if (box) {
        myUnetProfile = box.unets.filter(u => user.membership.unetid === u.unet_id)[0];
        isMainUnet = myUnetProfile?.unet_id === box.main_unet_id;
    }


    const onSubmit = async (event: FormValues) => {
        //Check not empty 
        if (!event.boxType && user.membership.type === MembershipType.FTTH || !event.macAddress) {
            alert("Veuillez remplir tous les champs");
            return;
        }
        // Check MAC format
        if (!event.macAddress.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
            alert("Adresse MAC invalide");
            return;
        }

        if (user.membership.type === MembershipType.FTTH) {
            try {
                const box = await Api.registerUserBox(user.id, event.boxType, event.macAddress, event.isTelecomian);
                setBox(box);
            } catch (e) {
                alert("Erreur lors de l'assignation de la box : " + e);
            }

        } else if (user.membership.type === MembershipType.WIFI) {
            try {
                const box = await Api.createUnetOnBox(user.id, event.macAddress, event.isTelecomian);
                setBox(box);
            } catch (e) {
                alert("Erreur lors de la création de l'Unet : " + e);
            }
        }
    }

    const onDeleteBox = () => {
        if (box.unets.length > 1) {
            alert("Vous ne pouvez pas supprimer la box tant que d'autres unets que le principal sont associés à cette box.");
            return;
        } else if (ont) {
            alert("Vous ne pouvez pas supprimer la box tant qu'un ONT est associé à cette box.");
            return;
        }

        setBoxLoading(true);
        Api.deleteBox(box.mac).then(() => {
            setBox(null);
        }).catch(e => {
            alert("Erreur lors de la suppression de la box : " + e);
        }).finally(() => {
            setBoxLoading(false);
        });
    }

    const onDeleteUnet = () => {
        if (isMainUnet) {
            alert("Vous ne pouvez pas supprimer le unet principal de la box.");
            return;
        }

        setBoxLoading(true);
        Api.deleteUnet(user.id).then(() => {
            setBox(null);
        }).catch(e => {
            alert("Erreur lors de la suppression de l'Unet : " + e);
        }).finally(() => {
            setBoxLoading(false);
        });
    }

    const onUpdateMac = () => {
        if (!newMac.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
            alert("Adresse MAC invalide");
            return;
        }
        setBoxLoading(true);
        Api.updateBoxMacAddress(box.mac, newMac).then((box) => {
            setBox(box);
        }).catch(e => {
            alert("Erreur lors de la modification de la MAC : " + e);
        }).finally(() => {
            setBoxLoading(false);
            setEditingMac(false);
        });
    }

    useEffect(() => {
        if (!user) return;
        if (user.membership.type === MembershipType.WIFI) {
            Api.fetchBoxBySSID(user.membership.init.ssid).then(box => {
                reset({
                    ...getValues(),
                    macAddress: box.mac,
                });
            });
        }
    }, [user?.id]);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Réseau de l'adhérent (UNetProfile)
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {(boxLoading) && <p>Chargement...</p>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    {!boxLoading && !box && (
                        <Stack direction={"column"}
                            spacing={2}>
                            <Controller
                                name="isTelecomian"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <FormControlLabel
                                        control={<Checkbox
                                            checked={value}
                                            onChange={onChange}
                                        />}
                                        label="⚠️ IP Télécommienne"
                                    />
                                )}
                            />
                            <div className={user.membership.type === MembershipType.WIFI ? "hidden" : ""}>
                                <FormControl>
                                    <InputLabel id="boxtype-label">Type de box</InputLabel>
                                    <Controller
                                        name="boxType"
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <Select
                                                className="bg-white"
                                                labelId="boxtype-label"
                                                id="boxtype-select"
                                                label="Type de box"
                                                value={value}
                                                onChange={onChange}
                                            >
                                                <MenuItem value="ac2350">AC 2350 (Box orange)</MenuItem>
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </div>
                            <Controller
                                name="macAddress"
                                control={control}
                                render={({ field: { onChange, value } }) => (
                                    <TextField
                                        className="bg-white"
                                        required
                                        label="Adresse MAC"
                                        value={value}
                                        onChange={onChange}
                                    />
                                )}
                            />
                            <Button variant="contained" type="submit">
                                {user.membership.type === MembershipType.FTTH ? "Assigner la box" : "Créer un Unet sur cette box"}
                            </Button>
                        </Stack>
                    )}
                </form>

                {!boxLoading && box && (
                    <>
                        <div className="mb-4">
                            <Typography variant="h6" align="left" component="div" >
                                Box
                            </Typography>
                            <strong>MAC</strong> :
                            {editingMac ?
                                <TextField
                                    value={newMac}
                                    onChange={(e) => setNewMac(e.target.value)}
                                /> : box.mac
                            }
                            {isMainUnet && <IconButton onClick={() => setEditingMac(!editingMac)}><EditIcon /></IconButton>}
                            {editingMac && <ConfirmableButton
                                variant="contained"
                                buttonColor="error"
                                onConfirm={onUpdateMac}
                                confirmationText={<p>La MAC de la box sera modifée en base de donnée,
                                et l'ONT associé sera mis à jour avec la nouvelle MAC.<br />
                                <br />
                                Les boxs ne seront pas redémarrées ni reconfigurées ! Ce
                                changement ne sera effectif <strong>qu'en base de données</strong>. Par exemple,
                                il est conseillé de redémarrer les boxs avec les deux adresses MAC afin
                                de ne pas avoir de duplication d'adresse.</p>}
                            >
                                Valider nouvelle mac
                            </ConfirmableButton>}
                            <br />
                            <strong>Type</strong> : {box.type}<br />
                            <strong>Unet principal</strong> : {main_unet.unet_id}<br />
                        </div>
                        <div>
                            <Typography variant="h6" align="left" component="div" >
                                UNetProfile
                            </Typography>
                            {!myUnetProfile && <Alert severity="warning">Rechargez la page pour voir toutes les infos</Alert>}
                            <strong>Unet principal de la box : </strong>{isMainUnet ? <Chip label="Oui" color="info" /> : <Chip label="Non" color="info" />} <br />
                            <strong>Unet ID de {user.first_name}</strong> : {myUnetProfile?.unet_id}<br />
                            <strong>IPv4 WAN</strong> : {myUnetProfile?.network.wan_ipv4.ip}<br />
                            <strong>IPv6 WAN</strong> : {myUnetProfile?.network.wan_ipv6.ip}<br />
                            <strong>SSID</strong> : {myUnetProfile?.wifi.ssid}<br />
                            <strong>PSK</strong> : {maskedPsk}<br />
                            <Button onClick={() => setMaskedPsk(myUnetProfile?.wifi.psk)}>Afficher PSK</Button>
                        </div>
                        <div>
                            {isMainUnet &&
                                <ConfirmableButton
                                    disabled={box.unets.length > 1 || ont !== null}
                                    variant="text"
                                    buttonColor="error"
                                    onConfirm={onDeleteBox}
                                    startIcon={<TrashIcon />}
                                    confirmationText="Le déprovisionning de la box est une action irreversible. Pensez à notez
                                    l'adresse MAC de la box si vous souhaitez la réassigner. Le unet principal sera supprimé."
                                >
                                    {box.unets.length > 1 && `Reste ${box.unets.length - 1} autre(s) Unet(s)`}
                                    {box.unets.length === 1 && ont && `ONT ${ont.serial_number} est associé`}
                                    {box.unets.length === 1 && !ont && "Supprimer la box"}
                                </ConfirmableButton>
                            }
                            {!isMainUnet &&
                                <ConfirmableButton
                                    variant="text"
                                    buttonColor="error"
                                    onConfirm={onDeleteUnet}
                                    startIcon={<TrashIcon />}
                                    confirmationText="Le déprovisionning de l'Unet est une action irreversible. Pensez à notez
                                    ses informations si vous souhaitez les réutiliser."
                                >
                                    Supprimer l'Unet
                                </ConfirmableButton>
                            }
                        </div>
                    </>
                )}
            </Typography>
        </div >
    )
}