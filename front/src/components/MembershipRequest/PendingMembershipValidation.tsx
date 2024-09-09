import { useContext } from "react";
import { DepositStatus, MembershipStatus, MembershipType, PaymentMethod, User } from "../../utils/types/types";
import { AppStateContext } from "../../utils/AppStateContext";
import { Alert, Button, Typography } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DownloadIcon from '@mui/icons-material/Download';
import { Config } from "../../utils/Config";
import { Launch } from "@mui/icons-material";

export default function PendingMembershipValidation({ user }: { user: User }): JSX.Element {
    if (user.membership.type === MembershipType.FTTH) {
        return <FTTHPendingMembershipValidation />;
    }
    else if (user.membership.type === MembershipType.WIFI) {
        return <WifiPendingMembershipValidation />;
    } else {
        return <Alert severity="error">
            Type d'adhésion inconnu
        </Alert>
    }
}

export function FTTHPendingMembershipValidation(): JSX.Element {
    let { appState } = useContext(AppStateContext);

    return (
        <>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Demande d'adhésion Fibre
            </Typography>
            <div className="flex flex-col gap-8">
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    {appState.user.membership.contract_signed ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                    <span className="ml-2">
                        Contrat de fourniture de service
                    </span>
                </Typography>
                <ContractSignatureInfo user={appState.user} />
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    {appState.user.membership.deposit_status === DepositStatus.PAID ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                    <span className="ml-2">
                        Caution 50€
                    </span>
                </Typography>
                <PaymentInfo type={PaymentType.DEPOSIT} method={appState.user.membership.init.payment_method_deposit} paid={appState.user.membership.deposit_status === DepositStatus.PAID} />
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    {appState.user.membership.paid_first_month ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                    <span className="ml-2">
                        Première cotisation 20€ (puis 20€/mois)
                    </span>
                </Typography>
                <PaymentInfo type={PaymentType.MEMBERSHIP} method={appState.user.membership.init.payment_method_first_month} paid={appState.user.membership.paid_first_month} />
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    Et ensuite ?
                </Typography>
                <Typography variant="body1" color="text.secondary" component="p" align="justify">
                    Nous t'enverrons un mail dès que les paiements auront été vérifiés. Ensuite,
                    tu pourras récupèrer tes équipements (Box Internet), et nous
                    te demanderons un créneau pendant lequel tu es disponible pour qu'un technicien
                    mandaté par Orange procède à l'installation de la fibre. Cette étape est obligatoire
                    car les infrastructures FTTH (Fibre To The Home) sont mutualisées. Ton adhésion
                    commencera le jour de l'installation de la fibre, et nous te demanderons de régler
                    ta cotisation de 20€ tous les mois à partir de ce moment.
                    <br />
                    <br />
                    Si tu as la moindre question, n'hésites pas à paser au local de l'association,
                    ou bien à envoyer un mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a>
                </Typography>
            </div>
        </>
    );
}

export function WifiPendingMembershipValidation(): JSX.Element {
    let { appState } = useContext(AppStateContext);

    return (
        <>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Demande d'adhésion Wi-Fi
            </Typography>
            <div className="flex flex-col gap-8">
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    {appState.user.membership.contract_signed ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                    <span className="ml-2">
                        Contrat de fourniture de service
                    </span>
                </Typography>
                <ContractSignatureInfo user={appState.user} />
                <div className="flex flex-col gap-4 items-start">
                    <Typography variant="body1" color="text.secondary" component="p" align="left">
                        En adhérant à rezel, tu t'engages à respecter le règlement intérieur de l'association.
                    </Typography>
                    <div className="flex flex-row gap-4">
                        <Button target="_blank" rel="noopener noreferrer" variant="text" color="primary" href="/static/RI_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon />} >
                            Réglement Intérieur
                        </Button>
                        <Button target="_blank" rel="noopener noreferrer" variant="text" color="primary" href="/static/RI_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon />} >
                            Statuts de l'association
                        </Button>
                    </div>
                </div>
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    {appState.user.membership.paid_first_month ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                    <span className="ml-2">
                        Première cotisation 10€ (puis 10€/mois)
                    </span>
                </Typography>
                <PaymentInfo type={PaymentType.MEMBERSHIP} method={appState.user.membership.init.payment_method_first_month} paid={appState.user.membership.paid_first_month} />
                <Typography variant="h5" color="text.secondary" component="div" align="left" className="flex items-center">
                    Et ensuite ?
                </Typography>
                <Typography variant="body1" color="text.secondary" component="p" align="justify">
                    Nous t'enverrons un mail dès que les paiements auront été vérifiés. Ensuite,
                    tu recevras un mail te confirmant qu'un nouveau réseau Wi-Fi a été crée pour toi,
                    et nous te demanderons de régler ta cotisation de 10€ tous les mois à partir de ce moment.
                    <br />
                    <br />
                    Si tu as la moindre question, n'hésites pas à paser au local de l'association,
                    ou bien à envoyer un mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a>
                </Typography>
            </div>
        </>
    );
}

enum PaymentType {
    DEPOSIT = "deposit",
    MEMBERSHIP = "membership"
}

function ContractSignatureInfo({ user }: { user: User }) {
    if (user.membership.contract_signed)
        return (
            <Typography variant="body1" color="text.secondary" component="p" align="left">
                Contrat signé reçu ! Tu recevras par mail une copie du contrat signé par le président de l'association.
            </Typography>
        );
    else if (user.membership.documenso_adherent_url)
        return (
            <div className="flex flex-col gap-4 items-start">
                <Button
                    target={user.membership.documenso_adherent_url}
                    href={user.membership.documenso_adherent_url}
                    variant="contained"
                    color="success"
                    startIcon={<Launch />}
                >
                    Signer le contrat en ligne
                </Button>
            </div>
        );
    else
        return (
            <div className="flex flex-col gap-4 items-start">
                <Typography variant="body1" color="text.secondary" component="p" align="left">
                    Un mail t'as été envoyé avec le contrat de fourniture de service pré-rempli. <br />
                    Merci de le signer et de le renvoyer à <a href="mailto:fai@rezel.net">fai@rezel.net</a>.
                </Typography>
            </div>
        );
}

function PaymentInfo({ type, method, paid }: { type: PaymentType, method: PaymentMethod, paid: boolean }) {
    if (paid)
        return (
            <Typography variant="body1" color="text.secondary" component="p" align="left">
                Paiment bien reçu !
            </Typography>
        );

    else if ([PaymentMethod.CHEQUE, PaymentMethod.ESPECE].includes(method))
        return (
            <Typography variant="body1" color="text.secondary" component="p" align="left">
                Tu as choisi de payer <strong>{method === PaymentMethod.CHEQUE ? "par chèque" : " en espèces"}</strong>. <br />
                Merci de passer au local de l'association, qui se trouve en salle 0A316 à Télécom Paris (19 Place Marguerite Perey).                <br />

                <br />
                Pour s'assurer de la présence d'un bénévole, envoie nous un mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a> en précisant à quelle heure tu souhaites passer.
            </Typography>
        );

    else if (method === PaymentMethod.VIREMENT)
        return (
            <div className="flex flex-col gap-4 items-start">
                <Typography variant="body1" color="text.secondary" component="p" align="left">
                    Tu as choisi de payer <strong>par virement bancaire</strong>.<br />
                    ⚠️ Tu dois impérativement mentionner <strong>ton nom et prénom dans le libellé du virement.</strong><br />
                </Typography>
                <Button target="_blank" rel="noopener noreferrer" variant="contained" color="primary" href="/static/RIB_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon />} >
                    Télécharger le RIB de Rezel
                </Button>
            </div>
        );

    else return (
        <Typography variant="body1" color="text.secondary" component="p" align="left">
            Une erreur est survenue, merci de contacter l'association par mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a>
        </Typography>
    );
}