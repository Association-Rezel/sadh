import { useContext, useEffect, useState } from "react";
import { Alert, Button, Checkbox, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, Link, List, MenuItem, Select, Stack, TextField, Tooltip, Typography, Box } from "@mui/material";
import { Api } from "../../../utils/Api";
import { MembershipType, User } from "../../../utils/types/types";
import { Controller, set, useForm } from "react-hook-form";
import TrashIcon from '@mui/icons-material/Delete';
import ConfirmableButton from "../../utils/ConfirmableButton";
import EditIcon from '@mui/icons-material/Edit';
import { ContentCopy, ExitToApp, ImportExport, TransferWithinAStation } from "@mui/icons-material";
import { validateIBAN } from "ngx-iban-validator/dist/iban.validator";

type FormValues = {
    iban: string;
};

export default function IbanSection({
    user,
    setUser
}: {
    user: User,
    setUser: (user: User) => void
}) {

    const [editingIban, setEditingIban] = useState(false);
    const [newIban, setNewIban] = useState("");

    const onUpdateIban = async () => {
        const ibanToUpdate = newIban.trim() === "" ? null : newIban;

        if (ibanToUpdate) {
            const validation = validateIBAN({ value: ibanToUpdate });
            if (validation?.ibanInvalid) {
                if (validation.error?.countryUnsupported) {
                    alert("Pays non supporté pour l'IBAN");
                    return;
                }
                if (validation.error?.codeLengthInvalid) {
                    alert("Longueur de l'IBAN invalide");
                    return;
                }
                if (validation.error?.patternInvalid) {
                    alert("Format de l'IBAN invalide");
                    return;
                }
            }
        }
        
        try {
            await Api.updateUser(user.id, { iban: ibanToUpdate });
            setUser({ ...user, iban: ibanToUpdate });
        } catch (e) {
            alert("Erreur lors de l'update de l'IBAN : " + e);
        } finally {
            setEditingIban(false);
        }
        
    };

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                IBAN
            </Typography>
            <Box mt={2} mb={1}>
                <strong>IBAN</strong>: <span className="pr-2" />
                {editingIban ? (
                    <TextField
                        value={newIban}
                        onChange={(e) => setNewIban(e.target.value)}
                    />
                ) : (
                    user.iban
                )}
                <IconButton onClick={() => setEditingIban(!editingIban)}>
                    <EditIcon />
                </IconButton>
            </Box>
            {editingIban && (
                <Box mt={2}>
                    <ConfirmableButton
                        variant="contained"
                        buttonColor="error"
                        onConfirm={onUpdateIban}
                        confirmationText={
                            <p>
                                L'IBAN va être mis à jour.
                            </p>
                        }
                    >
                        Valider nouveau IBAN
                    </ConfirmableButton>
                </Box>
            )}
        </div>
    );
}