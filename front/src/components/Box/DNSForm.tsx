import React, { useState } from "react";
import { Stack, TextField, FormControl, FormHelperText, InputLabel, Select, MenuItem } from "@mui/material";

import AddIcon from '@mui/icons-material/Add';

import PopupForm from "../utils/PopupForm";
import { Api } from "../../utils/Api";
import { UnetProfile } from "../../utils/types/hermes_types";

export function AddDNSForm({ unet, setUnet, type }: { unet: UnetProfile, setUnet: (value: UnetProfile) => void, type: 'ipv4' | 'ipv6' }) {
    const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Erreurs du formulaire

    const addDNS = (data: FormData) => {
        // Réinitialiser les erreurs du formulaire
        setErrors({});

        // vérifier l'ip
        const ip = data.get('ip') as string;
        if (!ip) {
            setErrors({ ip: "L'adresse IP est obligatoire" });
            return false;
        }

        // copy the box into a new one
        const newUnet = { ...unet };
        if (type == "ipv4") {
            newUnet.dhcp.dns_servers.ipv4.push(ip);
        } else {
            newUnet.dhcp.dns_servers.ipv6.push(ip);
        }

        try {
            Api.updateMyUnet(newUnet).then(setUnet);
        } catch (apiError) {
            setErrors({ ip: apiError.message || "Une erreur est survenue lors de la mise à jour du serveur DNS" });
            return false;
        }

        return true;
    }

    return (
        <PopupForm
            buttonText="Ajouter"
            onSubmit={addDNS}
            Title={`Ajouter un serveur DNS ${type == "ipv4" ? "IPv4" : "IPv6"}`}
            startIcon={<AddIcon />}
        >
            <Stack 
                direction={"column"}
                spacing={2}
                width={"100%"}
                marginTop={2}
            >
                <TextField
                    name="ip"
                    label="Adresse IP"
                    fullWidth
                    error={!!errors.ip}
                    helperText={errors.ip}
                    required
                />
            </Stack>
        </PopupForm>
    );
}