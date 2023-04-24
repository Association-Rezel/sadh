import { Divider, Grid, TextField, styled } from "@mui/material";

export function PageBoxe() {
  return (
    <>
      <h1>Ma boxe</h1>
      <Form></Form>
    </>
  );
}

function Form() {
  return (
    <Grid
      container
      spacing={5}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <TextField
        required
        id="outlined-basic"
        label="Wifi Name"
        variant="outlined"
        type="text"
      />
      <TextField
        required
        id="outlined-basic"
        label="Wifi password"
        variant="outlined"
        type="password"
      />
      <TextField
        disabled
        id="outlined-basic"
        label="Adresse ip"
        variant="outlined"
        type="text"
      />
    </Grid>
  );
}
