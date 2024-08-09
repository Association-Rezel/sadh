import { useContext } from "react";
import { DepositStatus, MembershipStatus, PaymentMethod, User } from "../../utils/types/types";
import { AppStateContext } from "../../utils/AppStateContext";
import { Button, Typography } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import DownloadIcon from '@mui/icons-material/Download';

export default function PendingMembershipValidation(): JSX.Element {
    let { appState } = useContext(AppStateContext);

    return (
        <>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Demande d'adhésion
            </Typography>
            <div className="flex flex-col gap-8">
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
                </Typography>
            </div>
        </>
    );
}

enum PaymentType {
    DEPOSIT = "deposit",
    MEMBERSHIP = "membership"
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
                <Button variant="contained" color="primary" href="/rib" className="mt-2" startIcon={<DownloadIcon />} >
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