import { Stack, TextField, Button, InputAdornment, CircularProgress } from "@mui/material";
import React from "react";
import { useState } from 'react';
import { Api } from "../../utils/Api";


export default function SsidResetForm({ unet, setUnet }) {
    const [newSSID, setNewSSID] = useState<string>(unet.wifi.ssid.replace("Rezel-", ""));
    const [error, setError] = useState<String>("");
    const [info, setInfo] = useState<String>("");
    const [loading, setLoading] = useState<boolean>(false);

    async function isSSIDValid() {
        if (newSSID.length < 10 - 6) {
            return { valid: false, message: "Le SSID doit contenir au moins 10 caractère" };
        } else if (newSSID.length > 32 - 6) {
            return { valid: false, message: "Le SSID doit contenir au plus 32 caractère" };
        } else {
            const valid = await Api.fetchValidSSID(`Rezel-${newSSID}`);

            if (!valid) {
                console.log("SSID already used");
                return { valid: false, message: "Le SSID est déjà utilisé" };
            }
        }
        return { valid: true, message: "" };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setInfo("");
        setError("");
        setLoading(true);

        const validSSID = await isSSIDValid();
        if (!validSSID.valid) {
            setError(validSSID.message);
        } else {
            // copy the box into a new one
            const newUnet = structuredClone(unet);
            newUnet.wifi.ssid = `Rezel-${newSSID}`;
            try {
                const unetResponse = await Api.updateMyUnet(newUnet);
                setNewSSID(unetResponse.wifi.ssid.replace("Rezel-", ""));
                setUnet(unetResponse);
                setInfo("Le SSID a bien été modifié, la modification sera effective à 6h du matin");
            } catch (apiError) {
                setError(apiError.message || "Une erreur est survenue lors de la mise à jour du SSID");
            }
        }
        setLoading(false);
    }

    return (
        <div style={{ width: "60%" }}>
            <form onSubmit={handleSubmit}>
                <Stack direction={"column"}
                    spacing={2}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"100%"}>
                    <TextField name="password"
                        required
                        label="Saisissez votre nouveau SSID"
                        variant="outlined"
                        sx={{ width: "100%" }}
                        InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                Rezel-
                              </InputAdornment>
                            ),
                        }}
                        value={newSSID}
                        onChange={(event) => setNewSSID(event.target.value)}
                        helperText={error ? error : info}
                        error={!!error}
                    />
                    <Button variant="contained" type="submit" disabled={newSSID === unet.wifi.ssid.replace("Rezel-", "") || loading}>
                        {loading ? <CircularProgress size="2em" /> : "Valider"}
                    </Button>
                </Stack>
            </form>
        </div>
    )
}