import { useContext, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, Link, List, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Api } from "../../../utils/Api";
import { Box, UnetProfile } from "../../../utils/types/hermes_types";
import { MembershipType, User } from "../../../utils/types/types";
import { Controller, set, useForm } from "react-hook-form";
import { ONTInfo } from "../../../utils/types/pon_types";
import TrashIcon from '@mui/icons-material/Delete';
import ConfirmableButton from "../../utils/ConfirmableButton";
import EditIcon from '@mui/icons-material/Edit';
import { ContentCopy, ExitToApp, ImportExport, TransferWithinAStation } from "@mui/icons-material";

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
    const [usersOnBox, setUsersOnBox] = useState<User[]>([]);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);

    if (box && newMac === "") {
        setNewMac(box.mac);
    }

    const mainUser = usersOnBox.find(u => u.membership?.unetid === box?.main_unet_id);
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
            Api.fetchBoxByUnetID(user.membership.init.main_unet_id).then(box => {
                reset({
                    ...getValues(),
                    macAddress: box.mac,
                });
            });
        }
    }, [user?.id]);

    useEffect(() => {
        if (!box) return;
        Api.fetchAllUsersOnBox(box.mac).then(users => {
            setUsersOnBox(users);
        }).catch(e => {
            alert(e);
        });
    }, [box]);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Réseau de l'adhérent (UNetProfile)
                {user.membership.type === MembershipType.WIFI &&
                    <Tooltip title="Transférer le UnetProfile vers une autre box">
                        <IconButton onClick={() => setTransferDialogOpen(true)}>
                            <ExitToApp />
                        </IconButton>
                    </Tooltip>
                }
            </Typography>
            <TransferUnetToMacDialog unet_id={user.membership.unetid} open={transferDialogOpen} setTransferDialogOpen={setTransferDialogOpen} />
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
                                        label="Assigner une IP du range 137.194.8.0/22 (Réservé au étudiants ou personnels de Télécom Paris)"
                                    />
                                )}
                            />
                            {user.membership.type === MembershipType.WIFI && user.membership.init.main_unet_id &&
                                <Alert severity="info">
                                    L'adhérent indique capter le Wi-Fi correspondant au unet id {user.membership.init.main_unet_id}. La mac correspondante est pré-renseignée ci-dessous
                                </Alert>

                            }
                            {user.membership.type === MembershipType.WIFI && !user.membership.init.main_unet_id &&
                                <Alert severity="error">
                                    L'adhérent avait indiqué un SSID avant le changement de système du 23/11/2024 (https://gitlab.fai.rezel.net/fai/sadh/-/merge_requests/22) Il faut lui redemander le Wi-Fi qu'il capte.
                                </Alert>
                            }
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
                            <Button
                                onClick={() => navigator.clipboard.writeText(generateManagementIPv6(box?.mac))}
                                startIcon={<ContentCopy />}
                                size="small"
                            >
                                {generateManagementIPv6(box?.mac)}
                            </Button>
                            <br />
                            <strong>MAC</strong> :<span className="pr-2" />
                            {editingMac ?
                                <TextField
                                    value={newMac}
                                    onChange={(e) => setNewMac(e.target.value)}
                                /> :
                                <Button
                                    onClick={() => navigator.clipboard.writeText(box.mac)}
                                    startIcon={<ContentCopy />}
                                    size="small"
                                >{box.mac}
                                </Button>
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
                            <br />
                            {mainUser &&
                                <>
                                    <strong>User principal</strong> :
                                    <Link underline="hover" className="pl-2" href={`/admin/users/${mainUser?.id}`}>{mainUser?.first_name}</Link> ({box?.main_unet_id})
                                    <br />
                                </>
                            }
                            <strong>Autres adhérents</strong> :
                            {!usersOnBox || usersOnBox.length <= 0 && <CircularProgress />}
                            {usersOnBox?.length === 1 && "Aucun"}
                            {usersOnBox?.length > 1 && <>
                                <ul className="mt-2">
                                    {usersOnBox.filter(u => u != mainUser).map(u => (
                                        <li key={u.id}><Link underline="hover" href={`/admin/users/${u.id}`} key={u.id}>{u.first_name + " " + u.last_name}</Link> ({u.membership?.unetid})</li>
                                    ))}
                                </ul>
                            </>
                            }
                        </div>
                        <div>
                            <Typography variant="h6" align="left" component="div" >
                                UNetProfile
                            </Typography>
                            {!myUnetProfile && <Alert severity="warning">Rechargez la page pour voir toutes les infos</Alert>}
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

function TransferUnetToMacDialog({ unet_id, open, setTransferDialogOpen }: { unet_id: string, open: boolean, setTransferDialogOpen: (open: boolean) => void }) {
    if (!open) return null;
    const transferForm = useForm(
        {
            defaultValues: {
                macAddress: "",
            }
        }
    );

    const onSubmit = (data: { macAddress: string }) => {
        Api.transferUnet(unet_id, data.macAddress).then(() => {
            window.location.reload();
        }).catch(e => {
            alert("Erreur lors du transfert : " + e);
        });
    }

    return (
        <Dialog open={open} onClose={() => setTransferDialogOpen(false)}>
            <DialogTitle>Transférer le UnetProfile</DialogTitle>
            <DialogContent>
                <div>
                    <p>
                        Indiquez l'adresse MAC de la box vers laquelle vous souhaitez transférer le UnetProfile.<br />
                        <br />
                        Le changement ne sera effectif qu'en base de données ! Il faudra redémarrer les deux boxes
                        ou attendre la prochaine synchronisation à 6h00 pour que le changement soit effectif.
                    </p>
                    <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                        <Stack direction={"column"}
                            spacing={2}>
                            <TextField
                                label="Adresse MAC"
                                {...transferForm.register("macAddress")}
                            />
                            <Button variant="contained" onClick={transferForm.handleSubmit(onSubmit)}>
                                Transférer
                            </Button>
                        </Stack>
                    </Typography>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function generateManagementIPv6(macAddress: string): string {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
        throw new Error("Invalid MAC address format.");
    }

    const normalizedMac = macAddress.replace(/[:-]/g, "");

    const eui64Mac = `${normalizedMac.slice(0, 6)}fffe${normalizedMac.slice(6)}`;

    const firstOctet = parseInt(eui64Mac.slice(0, 2), 16);
    const invertedFirstOctet = (firstOctet ^ 0x02).toString(16).padStart(2, "0"); // XOR with 0x02
    const eui64 = `${invertedFirstOctet}${eui64Mac.slice(2)}`;

    const ipv6Address = `fd99:fa1:ad4:65:${eui64.match(/.{1,4}/g)!.join(":")}`;

    return ipv6Address;
}
