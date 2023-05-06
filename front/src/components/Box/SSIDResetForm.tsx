import { Stack, TextField, Button } from "@mui/material";
import React from "react";
import { Api } from "../../utils/Api";


export default function SsidResetForm({box, setBox, setRefreshKey}){

    const [newSSID, setNewSSID] = React.useState<string>("");

    function ssidValid(){
        // TODO : vérifier que le SSID n'a pas déja été modifié dans les 24h
        return newSSID.length > 10;
    }


    function handleReset(e){
        if (!ssidValid()){
            alert("Le SSID doit contenir au moins 10 caractères");
            return;
        }
        
        // copy the box into a new one
        const newBox = {...box};
        newBox.SSID = newSSID;
        setBox(newBox);
        Api.updateMyBox(newBox);
        setRefreshKey((refreshKey) => refreshKey + 1);
    }

    return (
        <div style={{width:"60%"}}>
            <Stack direction={"column"} 
                spacing={2}
                alignItems={"center"}
                justifyContent={"center"}
                width={"100%"}>
                <TextField
                    required
                    id="rounded"
                    label="Saisissez votre nouveau SSID"
                    variant="outlined"
                    type="text"
                    sx={{ width: "100%" }}
                    onChange={(e) => {
                        setNewSSID(e.target.value);
                    }}
                />
                <Button variant="contained" 
                        onClick={(e) => {
                            handleReset(e);
                        }
                    }>Valider</Button>
            </Stack>
        </div>
    )
}