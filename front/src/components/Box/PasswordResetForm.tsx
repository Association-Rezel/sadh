import { Stack, TextField, Button } from "@mui/material";
import React from "react";
import { useState } from 'react';
import { Api } from "../../utils/Api";

function PasswordResetForm({ unet, setUnet }) {

  const [password, setPassword] = useState<String>("");
  const [error, setError] = useState<String>("");
  const [info, setInfo] = useState<String>("");

  function passwordValid() {
    return password.length >= 10;
  }


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInfo("");
    setError("");

    if (!passwordValid()) {
      setError("Le mot de passe doit contenir au moins 10 caractères");
      return;
    }

    // copy the box into a new one
    const newUnet = { ...unet };
    newUnet.wifi.psk = password;
    // Api.updateMyUnet(newUnet).then(setUnet);
    try {
      await Api.updateMyUnet(newUnet);
      setUnet(newUnet);
      setPassword("");
      setInfo("Le mot de passe a bien été modifié, la modification sera effective à 6h du matin");
    } catch (apiError) {
      setError(apiError.message || "Une erreur est survenue lors de la mise à jour du SSID");
    }
  }

  return (
    <div style={{ width: '60%' }}>
      <form onSubmit={handleSubmit}>
        <Stack direction={"column"}
          spacing={2}
          alignItems={"center"}
          justifyContent={"center"}
          width={"100%"}>
          <TextField name="password"
            required
            label="Saisissez votre nouveau mot de passe"
            variant="outlined"
            sx={{ width: "100%" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={error ? error : info}
            error={!!error}
          />
          <Button variant="contained" type="submit" disabled={!password}>Valider</Button>
        </Stack>
      </form>
    </div>
  );
}

export default PasswordResetForm;