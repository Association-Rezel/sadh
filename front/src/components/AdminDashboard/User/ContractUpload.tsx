import { useEffect, useState } from "react";
import { User as UserType } from "../../../utils/types/types";

import { Api } from "../../../utils/Api";
import { Config } from "../../../utils/Config";
import { Typography } from "@mui/material";
import { BorderAll } from "@mui/icons-material";


const blobToBase64 = blob => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
        reader.onloadend = () => {
        resolve(reader.result);
        };
    });
};

export default function ContractUpload({ zitadel_sub }: { zitadel_sub: string }) {
    const [user, setUser] = useState<UserType>();
    const [fileB64, setFileB64] = useState<string>();

    useEffect(() => {
        Api.fetchUser(zitadel_sub).then(user => {
            setUser(user);
        });
        Api.fetchFile("/users/"+zitadel_sub+"/contract").then(file => {
            blobToBase64(file).then((b64: string) => {
                setFileB64(b64);
            });
        }).catch(error => {
            setFileB64("0");
        });
    }, [zitadel_sub]);

    const handleSubmit = (event) => {
        event.preventDefault();
        let data = new FormData();
        data.append("file", event.target.file.files[0]);
        Api.uploadFile("/users/"+zitadel_sub+"/contract", data)
        .catch(error => {
            alert("Erreur lors de l'upload du contrat. Vous êtes peut-être déconnecté. La page va se rafraichir automatiquement.");
        }).finally(() => {
            window.location.reload();
        });
    }

    if (!user || !fileB64) return (<>Chargement du contrat...</>);

    if (fileB64!="0") {
        return (
            <div>
                <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                    Contrat
                </Typography>
                <iframe src={"data:application/pdf;base64;"+fileB64}></iframe>
            </div>
        );
    }
    
    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Upload du contrat
            </Typography>
            <form  onSubmit={handleSubmit}>
                <input type="file" name="file" accept="application/pdf"/>
                <button type="submit" style={{background: "lightgrey"}}>Envoyer</button>
            </form>
        </div>
    );
}
