import { Stack, TextField, Button } from "@mui/material";
import React from "react";
import { useState } from 'react';


function PasswordResetForm() {

  const [password, setPassword] = useState<String>("");

  function passwordValid(){
    return password.length >= 10;
  }


  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordValid()){
      alert("Votre mot de passe doit contenir au moins 10 caractères")
      return;
    }
    alert("Ton mot de passe a bien été changé ! (non; to-do)");
    // TODO: CALL backend API to change the password
  }

  return (
    <div style={{width:'60%'}}>
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
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="contained" type="submit">Valider</Button>
        </Stack>
      </form>
    </div>
  );
}

export default PasswordResetForm;