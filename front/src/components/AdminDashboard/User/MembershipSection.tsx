import {
    TextField,
    Button,
    IconButton,
    MenuItem,
    Typography,
    Alert,
    Icon,
    DialogTitle,
    DialogContent,
    Dialog,
    DialogContentText,
    DialogActions,
    Chip,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import EditIcon from '@mui/icons-material/Edit';
import Api from "../../../utils/Api";
import RefreshIcon from '@mui/icons-material/Refresh';
import { MembershipStatus, Membership, User, DepositStatus, EquipmentStatus, MembershipType } from "../../../utils/types/types";
import ConfirmableButton from "../../utils/ConfirmableButton"; // Import the new component
import MembershipTypeChip from "../../utils/Utils";
import DeleteIcon from '@mui/icons-material/Delete';
import { Config } from "../../../utils/Config";
import { TransferWithinAStation } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

interface MembershipSectionProps {
    setUser: (user: User) => void;
    user: User;
    registerToMembershipUpdateForm: any;
    formControl: any;
}

export default function MembershipSection({
    setUser,
    user,
    registerToMembershipUpdateForm,
    formControl,
}: MembershipSectionProps) {
    if (!user) return (<>Chargement...</>);

    const [manualStatusUpdate, setManualStatusUpdate] = useState<boolean>(false);
    const [openDialogWarningManualStatusUpdate, setOpenDialogWarningManualStatusUpdate] = useState<boolean>(false);
    const [confirmedStartDateEdit, setConfirmedStartDateEdit] = useState<boolean>(false);
    const [openDialogTransferMembership, setOpenDialogTransferMembership] = useState<boolean>(false);
    const [recreateContractLoading, setRecreateContractLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const onRecreateContract = () => {
        setRecreateContractLoading(true);
        Api.generateNewContract(user.id).then(() => {
            alert("Contrat recréé avec succès");
            window.location.reload();
        }).catch((e) => {
            alert("Erreur lors de la recréation du contrat");
        }).finally(() => {
            setRecreateContractLoading(false);
        });
    };

    const onRefreshContract = () => {
        setRefreshing(true);
        Api.refreshContract(user.id).then((user) => {
            setUser(user);
        }).catch((e) => {
            alert("Erreur lors du rafraichissement du contrat");
        }).finally(() => {
            setRefreshing(false);
        });
    }

    const startDateForm = useForm({
        defaultValues: {
            start: user.membership ? dayjs(user.membership.start_date) : null as Dayjs
        }
    });

    useEffect(() => {
        if (user?.membership)
            startDateForm.reset({ start: dayjs(user.membership.start_date) })
    }, [user])

    const onEditStartDate = () => {
        const date: Date = startDateForm.getValues("start").toDate();
        Api.updateMembership(user.id, { start_date: date }).then(() => {
            setUser({ ...user, membership: { ...user.membership, start_date: date } });
        }).catch(alert);
    }

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Abonnement <MembershipTypeChip type={user.membership.type} />
                <ConfirmableButton
                    variant="text"
                    confirmationText="La suppression de l'abonnement va supprimer toutes
                    les données associées à l'abonnement de l'adhérent. Les processus en
                    cours auprès d'Orange ne sont PAS gérés. Vérifiez que l'annulation
                    de l'abonnement à ce stade n'expose pas Rezel à des pénalités auprès
                    d'Orange, et à effecuter les actions nécessaires (ANNUL_ACCES ou autre)."
                    onConfirm={() => {
                        Api.deleteMembership(user.id).then(() => {
                            alert("Abonnement supprimée avec succès");
                            window.location.reload();
                        }).catch((e) => {
                            alert(e);
                        });
                    }}
                    type="iconbutton"
                >
                    <DeleteIcon />
                </ConfirmableButton>
                {user.membership?.type === MembershipType.FTTH && user.membership?.unetid &&
                    <>
                        <Tooltip title="Transférer les équipements à un autre utilsiateur">
                            <IconButton onClick={() => setOpenDialogTransferMembership(true)}>
                                <TransferWithinAStation />
                            </IconButton>
                        </Tooltip>
                        <TransferMembershipDialog
                            currentUser={user}
                            open={openDialogTransferMembership}
                            onClose={() => setOpenDialogTransferMembership(false)}
                        />
                    </>
                }
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <div className="flex flex-col gap-3 justify-items-start">
                    <span><strong>Adresse</strong> : {user?.membership.address.appartement_id} - {user?.membership.address.residence}</span>
                    <div className="grid grid-cols-3 gap-y-6">
                        {user.membership.type === MembershipType.FTTH && (
                            <>
                                <strong>Début de l'abonnement</strong>
                                <div className="flex flex-row gap-4 col-span-2">
                                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                                        <Controller
                                            name="start"
                                            control={startDateForm.control}
                                            render={({ field }) => (
                                                <DatePicker
                                                    {...field}
                                                    slotProps={{ textField: { variant: "standard" } }}
                                                    disabled={!confirmedStartDateEdit}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    <ConfirmableButton
                                        confirmationText={
                                            <>Modifier la date de début de l'abonnement aura pour
                                                effet de supprimer et de recréer tous les objects 'remboursement partiels'.
                                                Ces objets sont parfaitement indicatifs et vous pourrez ensuite refaire le tri
                                                pour cette utilisateur.<br />
                                                <br />
                                                La date de début d'abonnement est automatiquement ajoutée lors du passage à l'état ACTIVE.
                                            </>}
                                        onConfirm={() => setConfirmedStartDateEdit(!confirmedStartDateEdit)}
                                        type="iconbutton"
                                    >
                                        <EditIcon />
                                    </ConfirmableButton>
                                </div>
                            </>
                        )}
                        {confirmedStartDateEdit && startDateForm.formState.isDirty &&
                            <Button className="col-span-3" onClick={startDateForm.handleSubmit(onEditStartDate)} variant="contained" color="warning">
                                Enregistrer la date de début
                            </Button>
                        }
                        <strong>Statut</strong>
                        <div className="flex flex-row gap-4 col-span-2">
                            <StatusSelect
                                formControl={formControl}
                                name="status"
                                enumClass={MembershipStatus}
                                disabled={!manualStatusUpdate}
                            />
                            <IconButton onClick={() => manualStatusUpdate ? setManualStatusUpdate(false) : setOpenDialogWarningManualStatusUpdate(true)}><EditIcon /></IconButton>
                            <WarningManualStatusUpdateDialog open={openDialogWarningManualStatusUpdate} onConfirm={() => { setManualStatusUpdate(true) }} onClose={() => setOpenDialogWarningManualStatusUpdate(false)} />
                        </div>
                        {user.membership.type === MembershipType.FTTH && (
                            <>
                                <strong>Statut de la caution</strong>
                                <div className="col-span-2">
                                    <StatusSelect
                                        formControl={formControl}
                                        name="deposit_status"
                                        enumClass={DepositStatus}
                                    />
                                </div>
                                <strong>Statut des équipements</strong>
                                <div className="col-span-2">
                                    <StatusSelect
                                        formControl={formControl}
                                        name="equipment_status"
                                        enumClass={EquipmentStatus}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex items-center">
                        <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("paid_first_month")} />
                        <strong className="pl-2">Premier mois payé</strong>
                    </div>
                    <div className="flex items-center">
                        <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("paid_membership")} />
                        <strong className="pl-2">Cotisation payée</strong>
                    </div>
                    {!user.membership.documenso_contract_id && (
                        <>
                            <Alert severity="warning">
                                Aucun contrat documenso, mais vous pouvez en créer un !
                            </Alert>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={onRecreateContract}
                            >
                                Créer un contrat pour {user.first_name}
                            </Button>
                            <div className="flex items-center">
                                <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("contract_signed")} />
                                <strong className="pl-2">Contrat signé (Déprécié, préferer documenso)</strong>
                            </div>
                        </>
                    )}
                    {user.membership.documenso_contract_id && (
                        <>
                            <div className="flex items-center gap-2">
                                <strong>Contrat signé : </strong>
                                {user.membership.contract_signed && <Chip variant="outlined" label="Oui" color="success" />}
                                {!user.membership.contract_signed && <Chip label="Non" color="error" />}
                                <IconButton onClick={onRefreshContract}><RefreshIcon /></IconButton>
                                {refreshing && <CircularProgress />}
                            </div>
                            <div className="flex items-center gap-2">
                                <strong>ID du contrat documenso : </strong>{user.membership.documenso_contract_id}
                            </div>
                            <div className="flex items-center">
                                <ConfirmableButton
                                    variant="outlined"
                                    confirmationText="La recréation du contrat documenso va générer un nouveau contrat
                                        pour l'adhérent. Le contrat actuel sera supprimé et un nouveau contrat sera créé.
                                        ⚠️ Cette action est irréversible."
                                    onConfirm={onRecreateContract}
                                >
                                    Regénérer contrat
                                </ConfirmableButton>
                            </div>
                            <div className="flex items-center">
                                <Button size="small" variant="outlined" color="error" href={user.membership.documenso_adherent_url} target="_blank" rel="noreferrer">
                                    Signature (adhérent ⚠️)
                                </Button>
                            </div>
                            <div className="flex items-center">
                                <Button size="small" variant="outlined" color="success" href={user.membership.documenso_president_url} target="_blank" rel="noreferrer">
                                    Signature (président)
                                </Button>
                            </div>
                            <div className="flex items-center">
                                <Button size="small" variant="outlined" color="primary" href={`${Config.DOCUMENSO_BASE_URL}/t/rezel/documents/${user.membership.documenso_contract_id}`} target="_blank" rel="noreferrer">
                                    Voir le contrat
                                </Button>
                            </div>
                        </>
                    )}
                    {recreateContractLoading && <><Alert severity="info">Recréation du contrat en cours...</Alert><CircularProgress /></>}
                </div >
            </Typography>
        </div>
    )
}

function StatusSelect({ formControl, name, enumClass, disabled = false }: { formControl: any, name: string, enumClass: any, disabled?: boolean }) {
    return (
        <Controller
            control={formControl}
            name={name}
            render={({ field: { onChange, value, ref } }) => (
                <TextField
                    disabled={disabled}
                    fullWidth
                    select
                    variant="standard"
                    inputRef={ref}
                    value={value}
                    onChange={onChange}>
                    {Object.values(enumClass).filter(item => !isNaN(Number(item))).map((key: number) => <MenuItem value={key} key={key}>{enumClass[key]}</MenuItem>)}
                </TextField>
            )}
        />
    )
}

function WarningManualStatusUpdateDialog({ open, onConfirm, onClose }: { open: boolean, onConfirm: any, onClose: any }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>⚠️ Attention</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    L'édition manuelle du statut de l'abonnement n'appliquera pas les effets
                    de changement de statut. Par exemple, aucun mail ne sera envoyé à l'adhérent
                    ou à Orange (Interop).
                    <br />
                    <br />
                    De plus, si le statut revient à une étape ultérieure, et qu'un
                    membre de Rezel clique sur le bouton pour passer à l'étape suivante,
                    l'adhérent recevra de nouveau un mail de changement de statut.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={() => { onConfirm(); onClose() }}>Passer en édition manuelle</Button>
            </DialogActions>
        </Dialog>
    )
}

function TransferMembershipDialog({ currentUser, open, onClose }: { currentUser: User, open: boolean, onClose: any }) {
    const [targetUser, setTargetUser] = useState<User>();
    const [searchID, setSearchID] = useState<string>("");
    const [notFound, setNotFound] = useState<boolean>(false);

    const onSearch = () => {
        setNotFound(false);
        Api.fetchUser(searchID).then((user) => {
            if (user == null) {
                setNotFound(true);
                return;
            }
            setTargetUser(user);
        }).catch((e) => {
            alert(e);
        });
    }

    const onConfirm = () => {
        if (!targetUser) return;

        Api.transferDevices(currentUser.id, targetUser.id).then(() => {
            alert("Transfert effectué avec succès");
            window.location.reload();
            onClose();
        }).catch((e) => {
            alert(e);
        });
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Transférer les équipements</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Un abonnement ne peut pas être transférée à un utilisateur à proprement parler.
                    Cette action aura uniquement pour effet de transférer les équipements
                    (ONT et Box) à un autre utilisateur. Il n'y aura aucun effet sur la configuration
                    des équipements, ni des UNETs secondaires associés.<br />
                    <br />
                    En réalité, le seul effet en base de données est de transférer le
                    Unet principal de l'adhérent source à l'adhérent cible.
                </DialogContentText>
                <div className="mt-8">
                    <Alert severity="info">
                        L'UUID d'un utilisateur est disponible dans l'URL de la page de l'utilisateur
                    </Alert>
                    <strong>UUID de l'utilisateur auquel transférer les équipements</strong>
                    <div className="flex flex-row align-bottom gap-5">
                        <TextField
                            label="UUID"
                            variant="standard"
                            onChange={(e) => setSearchID(e.target.value)}
                            fullWidth
                        />
                        <Button onClick={onSearch} variant="outlined">Chercher</Button>
                    </div>
                    {notFound && <Alert severity="error">Utilisateur non trouvé</Alert>}
                    {targetUser && (
                        <div>
                            <strong>Utilisateur trouvé</strong>
                            <div>
                                <strong>Prénom</strong> : {targetUser.first_name}
                            </div>
                            <div>
                                <strong>Nom</strong> : {targetUser.last_name}
                            </div>
                            <div>
                                <strong>Email</strong> : {targetUser.email}
                            </div>
                        </div>
                    )}
                    {targetUser && targetUser.membership?.type !== MembershipType.FTTH && (
                        <Alert severity="error">L'utilisateur cible doit avoir un abonnement FTTH et aucun équipements associés</Alert>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={onConfirm}
                    disabled={!targetUser || targetUser.membership?.type !== MembershipType.FTTH}
                >
                    Transférer ONT et Box {targetUser?.first_name ? "à " + targetUser.first_name : ""}
                </Button>
            </DialogActions>
        </Dialog>
    )
}