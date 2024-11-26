import React, { useState } from "react";
import { Stack, TextField, FormControl, FormHelperText, InputLabel, Select, MenuItem } from "@mui/material";

import AddIcon from '@mui/icons-material/Add';

import PopupForm from "../utils/PopupForm";
import { Api } from "../../utils/Api";
import { UnetProfile } from "../../utils/types/hermes_types";

export function AddIPv4RedirectionForm({ unet, setUnet }: { unet: UnetProfile, setUnet: (value: UnetProfile) => void }) {
    const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Erreurs du formulaire

    const isValidName = (name: string) => {
        /* --- Vérifier que le nom est valide --
        - Le nom doit contenir au moins 3 caractères
        - Le nom doit être unique
        */
        if (name.length < 3) {
            return { valid: false, message: "Le nom doit contenir au moins 3 caractères" };
        } else if (unet.firewall.ipv4_port_forwarding.some((redirection) => redirection.name.trim() === name.trim())) {
            return { valid: false, message: "Le nom est déjà utilisé" };
        }
        return { valid: true };
    }

    const addRedirection = (data: FormData) => {
        // Réinitialiser les erreurs du formulaire
        setErrors({});

        const validName = isValidName(data.get('name') as string);
        if (!validName.valid) {
            setErrors((prev) => ({ ...prev, name: validName.message }));
            return false;
        }

        // Vérifier que les ports sont valides
        const wan_port = parseInt(data.get('wan_port') as string);
        if (isNaN(wan_port) || wan_port < 0 || wan_port > 65535) {
            setErrors((prev) => ({ ...prev, wan_port: 'Le port doit être un entier compris entre 0 et 65535' }));
            return false;
        }
        const lan_port = parseInt(data.get('lan_port') as string);
        if (isNaN(lan_port) || lan_port < 0 || lan_port > 65535) {
            setErrors((prev) => ({ ...prev, lan_port: 'Le port doit être un entier compris entre 0 et 65535' }));
            return false;
        }

        // Vérifier que l'adresse IP locale est non vide
        const lan_ip = data.get('lan_ip') as string;
        if (!lan_ip) {
            setErrors((prev) => ({ ...prev, lan_ip: 'L\'adresse IP locale est obligatoire' }));
            return false;
        }

        if (lan_ip.slice(0, 9) !== unet.network.lan_ipv4.address.slice(0, 9)) {
            const network_address = unet.network.lan_ipv4.address.replace(/192\.168\.(\d+).1+\/24+/, '192.168.$1.0/24');
            setErrors((prev) => ({ ...prev, lan_ip: 'L\'adresse IP locale doit être dans réseau ' + network_address }));
            return false;
        }

        // Vérifier que le protocole est valide
        const protocol = data.get('protocol') as string;
        if (protocol !== 'tcp' && protocol !== 'udp') {
            setErrors((prev) => ({ ...prev, protocol: 'Le protocole doit être TCP ou UDP' }));
            return false;
        }

        // copy the box into a new one
        const newUnet = { ...unet };
        newUnet.firewall.ipv4_port_forwarding.push({
            name: data.get('name') as string,
            desc: data.get('desc') as string,
            wan_port: wan_port,
            protocol: protocol,
            lan_ip: lan_ip,
            lan_port: lan_port
        });
        Api.updateMyUnet(newUnet).then(setUnet).catch((apiError) => {
            alert(apiError.message || "Une erreur est survenue lors de la mise à jour de la redirection de port");
        });

        return true;
    }

    return (
        <PopupForm
            buttonText="Ajouter"
            onSubmit={addRedirection}
            Title="Ajouter une redirection de port IPv4"
            startIcon={<AddIcon />}
        >
            <Stack
                direction={"column"}
                spacing={2}
                width={"100%"}
                marginTop={2}
            >
                <TextField
                    name="name"
                    label="Nom"
                    variant="outlined"
                    required
                    helperText={errors.name ? errors.name : "Le nom doit être unique"}
                    error={!!errors.name}
                />
                <TextField
                    name="desc"
                    multiline
                    rows={4}
                    label="Description"
                    variant="outlined"
                    helperText={errors.desc ? errors.desc : ""}
                    error={!!errors.desc}
                />
                <TextField
                    name="wan_port"
                    label="Port externe"
                    variant="outlined"
                    type="number"
                    required
                    helperText={errors.wan_port ? errors.wan_port : ""}
                    error={!!errors.wan_port}
                />
                <FormControl
                    required
                    error={!!errors.protocol}
                >
                    <InputLabel id="protocol-label-ipv4">Protocole</InputLabel>
                    <Select
                        labelId="protocol-label-ipv4"
                        label="Protocole"
                        name="protocol"
                        variant="outlined"
                    >
                        <MenuItem value="tcp">TCP</MenuItem>
                        <MenuItem value="udp">UDP</MenuItem>
                    </Select>
                    {errors.protocol && (
                        <FormHelperText>{errors.protocol}</FormHelperText>
                    )}
                </FormControl>
                <TextField
                    name="lan_ip"
                    label="Adresse IP locale"
                    variant="outlined"
                    required
                    helperText={errors.lan_ip ? errors.lan_ip : ""}
                    error={!!errors.lan_ip}
                />
                <TextField
                    name="lan_port"
                    label="Port local"
                    variant="outlined"
                    type="number"
                    required
                    helperText={errors.lan_port ? errors.lan_port : ""}
                    error={!!errors.lan_port}
                />
            </Stack>
        </PopupForm>
    );
}

export function AddIPv6OpeningForm({ unet, setUnet }: { unet: UnetProfile, setUnet: (value: UnetProfile) => void }) {
    const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Erreurs du formulaire

    const isValidName = (name: string) => {
        /* --- Vérifier que le nom est valide --
        - Le nom doit contenir au moins 3 caractères
        - Le nom doit être unique
        */
        if (name.length < 3) {
            return { valid: false, message: "Le nom doit contenir au moins 3 caractères" };
        } else if (unet.firewall.ipv6_port_opening.some((opening) => opening.name.trim() === name.trim())) {
            return { valid: false, message: "Le nom est déjà utilisé" };
        }
        return { valid: true };
    }

    const addOpening = (data: FormData) => {
        // Réinitialiser les erreurs du formulaire
        setErrors({});

        const validName = isValidName(data.get('name') as string);
        if (!validName.valid) {
            setErrors((prev) => ({ ...prev, name: validName.message }));
            return false;
        }

        // Vérifier que le protocole est valide
        const protocol = data.get('protocol') as string;
        if (protocol !== 'tcp' && protocol !== 'udp') {
            setErrors((prev) => ({ ...prev, protocol: 'Le protocole doit être TCP ou UDP' }));
            return false;
        }

        // Vérifier que l'adresse IP est non vide
        const ip = data.get('ip') as string;
        if (!ip) {
            setErrors((prev) => ({ ...prev, ip: 'L\'adresse IP est obligatoire' }));
            return false;
        }

        // Vérifier que les ports sont valides
        const port = parseInt(data.get('port') as string);
        if (isNaN(port) || port < 0 || port > 65535) {
            setErrors((prev) => ({ ...prev, port: 'Le port doit être un entier compris entre 0 et 65535' }));
            return false;
        }

        // copy the box into a new one
        const newUnet = { ...unet };
        newUnet.firewall.ipv6_port_opening.push({
            name: data.get('name') as string,
            desc: data.get('desc') as string,
            protocol: protocol,
            ip: ip,
            port: port
        });

        Api.updateMyUnet(newUnet).then(setUnet).catch((apiError) => {
            alert(apiError.message || "Une erreur est survenue lors de la mise à jour de l'ouverture de port");
        });

        return true;
    }

    return (
        <PopupForm
            buttonText="Ajouter"
            onSubmit={addOpening}
            Title="Ajouter une ouverture de port IPv6"
            startIcon={<AddIcon />}
        >
            <Stack
                direction={"column"}
                spacing={2}
                width={"100%"}
                marginTop={2}
            >
                <TextField
                    name="name"
                    label="Nom"
                    variant="outlined"
                    required
                    helperText={errors.name ? errors.name : "Le nom doit être unique"}
                    error={!!errors.name}
                />
                <TextField
                    name="desc"
                    multiline
                    rows={4}
                    label="Description"
                    variant="outlined"
                    helperText={errors.desc ? errors.desc : ""}
                    error={!!errors.desc}
                />
                <FormControl
                    required
                    error={!!errors.protocol}
                >
                    <InputLabel id="protocol-label-ipv6">Protocole</InputLabel>
                    <Select
                        labelId="protocol-label-ipv6"
                        label="Protocole"
                        name="protocol"
                        variant="outlined"
                    >
                        <MenuItem value="tcp">TCP</MenuItem>
                        <MenuItem value="udp">UDP</MenuItem>
                    </Select>
                    {errors.protocol && (
                        <FormHelperText>{errors.protocol}</FormHelperText>
                    )}
                </FormControl>
                <TextField
                    name="ip"
                    label="Adresse IPv6"
                    variant="outlined"
                    required
                    helperText={errors.ip ? errors.ip : ""}
                    error={!!errors.ip}
                />
                <TextField
                    name="port"
                    label="Port"
                    variant="outlined"
                    type="number"
                    required
                    helperText={errors.port ? errors.port : ""}
                    error={!!errors.port}
                />
            </Stack>
        </PopupForm>
    );
}
