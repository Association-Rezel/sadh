import { Button, Divider, Stack, Tooltip } from "@mui/material";

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import React, { useEffect, useState } from "react";
import Api from "../../utils/Api";

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

import ConfirmableButton from "../utils/ConfirmableButton";
import { AddDNSForm } from "./DNSForm";
import { AddIPv4RedirectionForm, AddIPv6OpeningForm } from "./FirewallForm";
import PasswordResetForm from "./PasswordResetForm";
import SsidResetForm from "./SSIDResetForm";

import { useAuthContext } from "../../pages/auth/AuthContext";
import { UnetProfile } from "../../utils/types/hermes_types";
import ImgUrl from "/src/ressources/img/router.png";


export default function MyNetworkConfigurationPage() {
    const { user } = useAuthContext();

    const [unet, setUnet] = useState<UnetProfile | null>(null);

    React.useEffect(() => {
        Api.fetchMyUnet().then(setUnet);

    }, [user.id]);

    if (unet === null) return <div>Chargement...</div>;

    return (
        <Stack
            direction={"column"}
            spacing={2}>
            <BoxPreview unet={unet} />
            <Divider />
            <Stack
                direction={"column"}
                spacing={{ xs: 1, sm: 2, md: 2 }}
                alignItems="center"
                justifyContent="center"
            >

                <Stack
                    direction={"column"}
                    spacing={{ xs: 1, sm: 2, md: 2 }}
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                >
                    <h3>Modifier le SSID <SSIDHelper /></h3>

                    <SsidResetForm
                        unet={unet}
                        setUnet={setUnet}
                    />
                </Stack>
                <Stack
                    direction={"column"}
                    spacing={{ xs: 1, sm: 2, md: 2 }}
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                >
                    <h3>Changer le mot de passe du WiFi</h3>
                    <PasswordResetForm unet={unet} setUnet={setUnet} />
                </Stack>
            </Stack>
            <Divider />
            <Stack
                direction={"column"}
                spacing={{ xs: 1, sm: 2, md: 2 }}
                alignItems="center"
                justifyContent="center"
                width="100%"
            >
                <FirewallInfos unet={unet} setUnet={setUnet} />
            </Stack>
            
            <Divider />
            <Stack
                direction={"column"}
                spacing={{ xs: 1, sm: 2, md: 2 }}
                alignItems="center"
                justifyContent="center"
                width="100%"
            >
                <DNSServers unet={unet} setUnet={setUnet} />
            </Stack>
           
        </Stack >
    );
}

function BoxPreview({ unet }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2, md: 4 }}
            alignItems="center"
            justifyContent="center"
        >
            <BoxImage />
            <BoxInfos unet={unet} />

        </Stack>
    )
}

function BoxImage() {
    return <img
        src={ImgUrl}
        alt="box-image"
        style={{
            width: '10%',
            marginRight: '20px'
        }} />
}

function BoxInfos({ unet }) {

    const [stateCopy, setStateCopy] = React.useState<string>("Copier le mot de passe");
    const [stateIcon, setStateIcon] = React.useState<React.ReactNode>(<ContentCopyIcon />);

    function handleCopyPassword(event: React.MouseEvent<HTMLButtonElement>) {
        navigator.clipboard.writeText(unet.wifi.psk);
        setStateCopy("Mot de passe copié !");
        setStateIcon(<DoneIcon />);

    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setStateCopy("Copier le mot de passe");
            setStateIcon(<ContentCopyIcon />);
        }, 500);
        return () => clearTimeout(timer);
    }, [stateCopy]);

    return (
        <div style={{ textAlign: 'left' }}>
            <h2>Les paramètres de mon réseau</h2>
            <br />
            <div>
                <b>SSID : </b> {unet.wifi.ssid}
                <br />
                <b>Préfixe IPv6 : </b> {unet.network.ipv6_prefix}
                <br />
                <b>Adresse IP publique IPv6 : </b> {unet.network.wan_ipv6.ip}
                <br />
                <b>Adresse IP publique IPv4 : </b> {unet.network.wan_ipv4.ip}
                <br />
                <b>Adresse locale du routeur : </b> {unet.network.lan_ipv4.address}
                <br />
                <b>Mot de passe WiFi : </b> {unet.wifi.psk.replace(/./g, '*')}
                <br /> <br />
                <Button variant="outlined" onClick={handleCopyPassword}>{stateIcon}{stateCopy}</Button>
            </div>
        </div>
    )
}

function SSIDHelper() {
    return (
        <Tooltip title="Le SSID est le nom de votre réseau Wifi. Il est visible par tous les appareils à proximité de votre box.">
            <HelpOutlineIcon />
        </Tooltip>
    )
}

function FirewallInfos({ unet, setUnet }) {
    const deleteRedirection = (type: 'ipv4' | 'ipv6', index: number) => {
        const newUnet = structuredClone(unet);

        if (type === 'ipv4') {
            newUnet.firewall.ipv4_port_forwarding.splice(index, 1);
        } else if (type === 'ipv6') {
            newUnet.firewall.ipv6_port_opening.splice(index, 1);
        } else {
            throw new Error('Unknown redirection type');
        }

        Api.updateMyUnet(newUnet).then(setUnet);
    }

    return (
        <div style={{ textAlign: 'left', width: '60%' }}>
            <h2>Pare-feu</h2>
            <br />
            <p><i>Toute modification sera effective à 6h du matin</i></p>
            <br />
            <div>
                <div>
                    <h3>Redirection de port IPv4</h3>
                    {unet.firewall.ipv4_port_forwarding.length > 0 ? (
                        unet.firewall.ipv4_port_forwarding.map((forwarded, index) => {
                            return (
                                <div key={index}>
                                    <br />
                                    <b>Nom : </b> {forwarded.name}
                                    <br />
                                    <b>Description : </b>
                                    <br />
                                    <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                        {forwarded.desc}
                                    </div>
                                    <br />
                                    <b>Port externe : </b> {forwarded.wan_port}
                                    <br />
                                    <b>Protocole : </b> {forwarded.protocol.toUpperCase()}
                                    <br />
                                    <b>Adresse locale : </b> {forwarded.lan_ip}
                                    <br />
                                    <b>Port local : </b> {forwarded.lan_port}
                                    <br />
                                    <ConfirmableButton
                                        buttonColor="error"
                                        variant="outlined"
                                        onConfirm={() => deleteRedirection('ipv4', index)}
                                        confirmationText="Êtes-vous sûr de vouloir supprimer cette redirection de port ?"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Supprimer
                                    </ConfirmableButton>
                                </div>
                            )
                        })
                    ) : (<p>Pas de port redirigé en IPv4</p>)}
                    <br />
                    <AddIPv4RedirectionForm unet={unet} setUnet={setUnet} />
                </div>
                <br />
                <div>
                    <h3>Ouverture de port IPv6</h3>
                    {unet.firewall.ipv6_port_opening.length > 0 ? (
                        unet.firewall.ipv6_port_opening.map((opened, index) => {
                            return (
                                <div key={index}>
                                    <br />
                                    <b>Nom : </b> {opened.name}
                                    <br />
                                    <b>Description : </b>
                                    <br />
                                    <div style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                        {opened.desc}
                                    </div>
                                    <br />
                                    <b>Protocole : </b> {opened.protocol.toUpperCase()}
                                    <br />
                                    <b>IPv6 ouverte : </b> {opened.ip}
                                    <br />
                                    <b>Port ouvert : </b> {opened.port}
                                    <br />
                                    <ConfirmableButton
                                        buttonColor="error"
                                        variant="outlined"
                                        onConfirm={() => deleteRedirection('ipv6', index)}
                                        confirmationText="Êtes-vous sûr de vouloir supprimer cette ouverture de port ?"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Supprimer
                                    </ConfirmableButton>
                                </div>
                            )
                        })
                    ) : (<p>Pas de port ouvert en IPv6</p>)}
                    <br />
                    <AddIPv6OpeningForm unet={unet} setUnet={setUnet} />
                </div>
            </div>
        </div>
    )
}

function DNSServers({ unet, setUnet }) {
    const deleteDNS = (type: 'ipv4' | 'ipv6', index: number) => {
        const newUnet = structuredClone(unet);

        if (type === 'ipv4') {
            newUnet.dhcp.dns_servers.ipv4.splice(index, 1);
        } else if (type === 'ipv6') {
            newUnet.dhcp.dns_servers.ipv6.splice(index, 1);
        } else {
            throw new Error('Unknown redirection type');
        }

        Api.updateMyUnet(newUnet).then(setUnet);
    }

    return (
        <div style={{ textAlign: 'left', width: '60%' }}>
            <h2>Serveurs DNS</h2>
            <br />
            <p><i>Serveurs DNS distribués à vos appareils par le serveur DHCP de la box.</i></p>
            <br />
            <p><i>Toute modification sera effective à 6h du matin</i></p>
            <br />
            <div>
                <div>
                    <h3>Serveurs DNS IPv4</h3>
                    <p><i>DNS par défaut : 8.8.8.8 et 1.1.1.1</i></p>
                    {unet.dhcp.dns_servers.ipv4.length > 0 ? (
                        unet.dhcp.dns_servers.ipv4.map((server, index) => {
                            return (
                                <div key={index}>
                                    <br />
                                    <b>Serveur {index + 1} : </b> {server}
                                    &nbsp;&nbsp;
                                    <ConfirmableButton
                                        buttonColor="error"
                                        variant="outlined"
                                        onConfirm={() => deleteDNS('ipv4', index)}
                                        confirmationText="Êtes-vous sûr de vouloir supprimer ce serveur DNS ?"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Supprimer
                                    </ConfirmableButton>
                                </div>
                            )
                        })
                    ) : (<p>Pas de serveur DNS en IPv4</p>)}
                    <br />
                    <AddDNSForm unet={unet} setUnet={setUnet} type="ipv4" />
                </div>
                <br />
                <div>
                    <h3>Serveurs DNS IPv6</h3>
                    <p><i>DNS par défaut : 2001:4860:4860::8888 et 2606:4700:4700::1111</i></p>
                    {unet.dhcp.dns_servers.ipv6.length > 0 ? (
                        unet.dhcp.dns_servers.ipv6.map((server, index) => {
                            return (
                                <div key={index}>
                                    <br />
                                    <b>Serveur {index + 1} : </b> {server}
                                    &nbsp;&nbsp;
                                    <ConfirmableButton
                                        buttonColor="error"
                                        variant="outlined"
                                        onConfirm={() => deleteDNS('ipv6', index)}
                                        confirmationText="Êtes-vous sûr de vouloir supprimer cette redirection de port ?"
                                        startIcon={<DeleteIcon />}
                                    >
                                        Supprimer
                                    </ConfirmableButton>
                                </div>
                            )
                        })
                    ) : (<p>Pas de serveur DNS en IPv6</p>)}
                    <br />
                    <AddDNSForm unet={unet} setUnet={setUnet} type="ipv6" />
                </div>
            </div>
        </div>
    )
}
