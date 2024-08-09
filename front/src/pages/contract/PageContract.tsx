import { useEffect, useState } from "react";
import LoggedMenu from "../../components/Menus/LoggedMenu";
import { Api } from "../../utils/Api";

const blobToBase64 = (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    return new Promise(resolve => {
        reader.onloadend = () => {
            resolve(reader.result);
        };
    });
};

export function PageContract() {
    const [fileB64, setFileB64] = useState<string>();

    useEffect(() => {
        Api.fetchFile("/users/me/contract").then((file) => {
            blobToBase64(file).then((b64: string) => {
                setFileB64(b64);
            });
        }).catch(error => {
            setFileB64("0");
        });
    }, []);

    if (!fileB64){
        return (
            <>
                <LoggedMenu />
                Chargement...
            </>
        );
    }

    if (fileB64 == "0") {
        return (
            <>
                <LoggedMenu />
                <h1>404</h1>
                <p>Impossible de trouver le contrat. Il sera très prochainement disponible.</p>
            </>
        );
    }

    return (
        <>
            <LoggedMenu />
            <iframe src={"data:application/pdf;base64;"+fileB64} width="100%" style={{height: "calc(100vh - 65px)"}}></iframe>
        </>
    )
}