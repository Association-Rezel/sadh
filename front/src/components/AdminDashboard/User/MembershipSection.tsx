import { MembershipStatus, Membership, User, DepositStatus, EquipmentStatus } from "../../../utils/types/types";
import { TextField, Button, IconButton, MenuItem, Select, Typography, Alert, Icon, DialogTitle, DialogContent, Dialog, DialogContentText, DialogActions } from "@mui/material";
import { useState } from "react";
import { Controller } from "react-hook-form";
import EditIcon from '@mui/icons-material/Edit';


export default function MembershipSection({ user, registerToMembershipUpdateForm, formControl }: { user: User, registerToMembershipUpdateForm: any, formControl: any }) {
    if (!user) return (<>Chargement...</>);

    const [manualStatusUpdate, setManualStatusUpdate] = useState<boolean>(false);
    const [openDialogWarningManualStatusUpdate, setOpenDialogWarningManualStatusUpdate] = useState<boolean>(false);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Adhésion FTTH
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <div className="flex flex-col gap-3 justify-items-start">
                    <span><strong>Adresse</strong> : {user?.membership.address.appartement_id} - {user?.membership.address.residence}</span>
                    <div className="grid grid-cols-3 gap-y-6">
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
                    </div>
                    <div className="flex items-center">
                        <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("paid_first_month")} />
                        <strong className="pl-2">Premier mois payé</strong>
                    </div>
                    <div className="flex items-center">
                        <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("contract_signed")} />
                        <strong className="pl-2">Contrat signé</strong>
                    </div>
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
                    L'édition manuelle du statut de l'adhésion n'appliquera pas les effets
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