import { MembershipStatus, Membership, User, DepositStatus, EquipmentStatus } from "../../../utils/types/types";
import { TextField, Button, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { useState } from "react";
import { Api } from "../../../utils/Api";
import { Controller } from "react-hook-form";


export default function MembershipSection({ user, registerToMembershipUpdateForm, formControl }: { user: User, registerToMembershipUpdateForm: any, formControl: any }) {
    if (!user) return (<>Chargement...</>);


    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Adhésion FTTH
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <strong>Adresse</strong> : {user?.membership.address.appartement_id} - {user?.membership.address.residence}
                <br />
                <strong>Statut</strong>
                <div className="mb-3">
                    <Controller
                        control={formControl}
                        defaultValue={user.membership.status}
                        name="status"
                        render={({ field: { onChange, value, ref } }) => (
                            <Select
                                inputRef={ref}
                                value={value}
                                onChange={onChange}>
                                {Object.values(MembershipStatus).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{MembershipStatus[key]}</MenuItem>)}
                            </Select>
                        )}
                    />
                </div>
                <strong>Etat de la caution</strong>
                <div className="mb-3">
                    <Controller
                        control={formControl}
                        defaultValue={user.membership.deposit_status}
                        name="deposit_status"
                        render={({ field: { onChange, value, ref } }) => (
                            <Select
                                inputRef={ref}
                                value={value}
                                onChange={onChange}>
                                {Object.values(DepositStatus).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{DepositStatus[key]}</MenuItem>)}
                            </Select>
                        )}
                    />
                </div>
                <strong>Etat des équipements</strong>
                <div className="mb-3">
                    <Controller
                        control={formControl}
                        defaultValue={user.membership.equipment_status}
                        name="equipment_status"
                        render={({ field: { onChange, value, ref } }) => (
                            <Select
                                inputRef={ref}
                                value={value}
                                onChange={onChange}>
                                {Object.values(EquipmentStatus).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{EquipmentStatus[key]}</MenuItem>)}
                            </Select>
                        )}
                    />
                </div>
                <div className="flex items-center">
                    <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("paid_first_month")} />
                    <strong className="pl-2">Premier mois payé</strong>
                </div>
                <div className="flex items-center">
                    <input style={{ boxShadow: "none", background: "none", margin: "0px", width: "30px" }} type="checkbox" {...registerToMembershipUpdateForm("contract_signed")} />
                    <strong className="pl-2">Contrat signé</strong>
                </div>
            </Typography>
        </div>
    )
}