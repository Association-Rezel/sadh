import { Stack, TextField, Button } from "@mui/material";
import React from "react";
import { useState, useRef } from 'react';

interface PasswordResetFormState {
  password: string;
  passwordVerify: string,
}

function PasswordResetForm() {
  const [state, setState] = useState<PasswordResetFormState>({
    password: "",
    passwordVerify: "",
  });

  const passwordField = useRef<HTMLInputElement>(null);
  const passwordVerifyField = useRef<HTMLInputElement>(null);

  function passwordMatch() {
    return (
      state.password === state.passwordVerify
    )
  }

  function passwordValid(){
    // check if the password has at least 
    // 8 characters, one uppercase, one lowercase and one number
    return (
      state.password.length >= 8 &&
      state.password.match(/[a-z]/g) &&
      state.password.match(/[A-Z]/g) &&
      state.password.match(/[0-9]/g)
    );
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    // this handler just modifies the states without checking password validity
    const target = event.target;
    const name = target.name;
    const value = target.value;
    // alert if the passwords don't match
    if (name === "password"){
      setState({...state, password: value});
    }
    if (name === "passwordVerify") {
      setState({...state, passwordVerify: value});
      return 1;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Verify that the passwords match
    if (!passwordMatch()) {
      alert("Les mots de passe ne correspondent pas");
      return ;
    }
    if (!passwordValid()){
      alert("Votre mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre")
      return;
    }
    alert("Your password has been changed !");
    // CALL backend API to change the password
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
            inputRef={passwordField}
            required
            label="Saisissez votre nouveau mot de passe"
            variant="outlined"
            type="password"
            sx={{ width: "100%" }}
            onChange={handleInputChange}
            error={!passwordMatch()}
          />
          <TextField name="passwordVerify"
            inputRef={passwordVerifyField}                       
            required
            label="Confirmez votre nouveau mot de passe"
            variant="outlined"
            type="password"
            sx={{ width: "100%" }}
            onChange={handleInputChange}
            error={!passwordMatch()}
          />
          <Button variant="contained" type="submit">Valider</Button>
        </Stack>
      </form>
    </div>
  );
}

export default PasswordResetForm;
