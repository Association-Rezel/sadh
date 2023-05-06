import { Divider, Stack, Button, Tooltip } from "@mui/material";
// import box interface from utils
import { Box } from "../../utils/types";
import React, { useEffect } from "react";
import { Api } from "../../utils/Api";
import PasswordResetForm from "./PasswordResetForm";
import SsidResetForm from "./SSIDResetForm";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';

import ImgUrl from "/src/ressources/img/router.png" 

// TODO : enlever nullBox et mettre un élément de chargement tant que nullBox est undefined

const nullBox: Box = {
    id: 0,
    ip: "",
    owner: null,
    SSID: "",
    passwordHash: "",
    connectedDevices: 0,
    openPorts: [],
};

export default function BoxConfigurationPage() {
    const [myBox, setMyBox] = React.useState<Box>(nullBox);
    const [refreshKey, setRefreshKey] = React.useState<number>(0);
    React.useEffect(() => {
        // l'id donné est bidon, jusqu'a modif des types...
        Api.fetchMyBox(1).then((myBox) => setMyBox(myBox));
    }, [refreshKey]);

    
        
  return (
    <Stack 
        direction={"column"} 
        spacing={2}>
      <BoxPreview box = {myBox}/>
      <br />
        <Divider />
        <Stack
            direction={"column"}
            spacing={{ xs: 1, sm: 2, md: 2 }}
            alignItems="center"
            justifyContent="center"
        >
            <div style={{ width: "100%"}}>
            <h3>Modifier le SSID de la Box <SSIDHelper/></h3>
            </div>
            
            <SsidResetForm 
                box={myBox} 
                setBox={setMyBox} 
                setRefreshKey={setRefreshKey}></SsidResetForm>

            <h3>Changer le mot de passe du WiFi</h3>
            <PasswordResetForm></PasswordResetForm>
     </Stack>
    </Stack>
  );
}

function BoxPreview({box}){
    return (
    <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 2, md: 4 }}
        alignItems="center"
        justifyContent="center"
        >
            <BoxImage/>
            <BoxInfos box={box}/>
            
    </Stack>
    )  
    }

function BoxImage(){
    return <img 
        src={ImgUrl}
        alt="box-image" 
        style={{ 
            width: '10%', 
            marginRight: '20px' }} />
}

function BoxInfos({box}){

    const  [stateCopy, setStateCopy] = React.useState<string>("Copier le mot de passe");
    const [stateIcon, setStateIcon] = React.useState<React.ReactNode>(<ContentCopyIcon/>);

    function handleCopyPassword(event : React.MouseEvent<HTMLButtonElement>){
        navigator.clipboard.writeText(box.passwordHash);
        setStateCopy("Mot de passe copié !");
        setStateIcon(<DoneIcon/>);
        
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setStateCopy("Copier le mot de passe");
            setStateIcon(<ContentCopyIcon/>);
        }, 500);
        return () => clearTimeout(timer);
    }, [stateCopy]);

    return (
    <div style={{textAlign:'left'}}> 
        <h2>Ma box</h2>
        <div>
            <b>SSID : </b> {box.SSID}
            <br />
            <b>Adresse IP publique : </b> {box.ip}
            <br />
            <b>Nombre d'appareils connectés : </b> {box.ConnectedDevices}
            <br/>
            <Button variant="outlined" 
                onClick={handleCopyPassword}
                >{stateIcon}{stateCopy}</Button>

        </div>
    </div>
)
}



function SSIDHelper(){
    return (
        <Tooltip title="Le SSID est le nom de votre réseau Wifi. Il est visible par tous les appareils à proximité de votre box.">
            <HelpOutlineIcon />
        </Tooltip>
    )
}






