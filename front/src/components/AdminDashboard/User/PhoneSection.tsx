import { useContext, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, Link, List, MenuItem, Select, Stack, TextField, Tooltip, Typography, Box } from "@mui/material";
import Api from "../../../utils/Api";
import { MembershipType, User } from "../../../utils/types/types";
import { Controller, set, useForm } from "react-hook-form";
import TrashIcon from '@mui/icons-material/Delete';
import ConfirmableButton from "../../utils/ConfirmableButton";
import EditIcon from '@mui/icons-material/Edit';
import { ContentCopy, ExitToApp, ImportExport, TransferWithinAStation } from "@mui/icons-material";
import { isValidPhoneNumber } from 'react-phone-number-input';



export default function PhoneSection({
    user,
    setUser
}: {
    user: User,
    setUser: (user: User) => void
}) {

    const [editingPhone, setEditingPhone] = useState(false);
    const [editingVerified, setEditingVerified] = useState(false);
    const [newPhone, setNewPhone] = useState(user?.phone_number ? user.phone_number : "");
    const [phoneVerifiedToUpdate, setPhoneVerifiedToUpdate] = useState<boolean>(user.phone_number_verified);

    const onUpdatePhone = async () => {
        setEditingVerified(false);
        const PhoneToUpdate = newPhone.trim() === "" ? null : newPhone;

        if (PhoneToUpdate) {
            const validation = isValidPhoneNumber(PhoneToUpdate);
            if (!validation) {
                alert("Mauvais format pour le numéro de téléphone, utiliser le format internationnal (+33 pour la France par ex.)");
                return;
            }
        }
        
        try {
            await Api.updateUser(user.id, { phone_number: PhoneToUpdate, phone_number_verified: phoneVerifiedToUpdate });
            setUser({ ...user, phone_number: PhoneToUpdate });
        } catch (e) {
            alert("Erreur lors de l'update du téléphone : " + e);
        } finally {
            setEditingPhone(false);
        }
        
    };

    const toggleVerified = async (verified : boolean) => {
        setEditingVerified(!editingVerified);
        setPhoneVerifiedToUpdate(verified)
    }

    return (
        <Typography variant="body1" align="left" color="text.secondary" component="div" className="mt-3">
            <div className="mt-10 max-w-xs">
                <Typography variant="h5" align="left" color="text.primary" component="div">
                    Téléphone
                </Typography>
                <Box mt={2} mb={1}>
                    <strong>Téléphone</strong>: <span className="pr-2" />
                    {editingPhone ? (
                        <TextField
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                        />
                    ) : (
                        user.phone_number
                    )}
                    <IconButton onClick={() => setEditingPhone(!editingPhone)}>
                        <EditIcon />
                    </IconButton>
                </Box>
            </div>
            <div className="flex items-center mt-5">
                <input type="checkbox" checked={phoneVerifiedToUpdate} onChange={(e) => toggleVerified(e.target.checked) } />
                <strong className="pl-2">Numéro vérifié</strong>
            </div>
            {(editingPhone || editingVerified) && (
                <Box mt={2}>
                    <ConfirmableButton
                        variant="contained"
                        buttonColor="error"
                        onConfirm={onUpdatePhone}
                        confirmationText={
                            <p>
                                Les informations du téléphone vont être mises à jour.
                            </p>
                        }
                    >
                        Valider modification
                    </ConfirmableButton>
                </Box>
            )}
        </Typography>
    );
}