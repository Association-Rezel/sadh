import {Launch} from "@mui/icons-material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DownloadIcon from '@mui/icons-material/Download';
import PendingIcon from '@mui/icons-material/Pending';
import {Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography} from "@mui/material";
import {useAuthContext} from "../../pages/auth/AuthContext";
import {DepositStatus, MembershipType, User} from "../../utils/types/types";
import {useCallback, useEffect, useRef, useState} from "react";
import {Paper} from "@mui/material";
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Chip from '@mui/material/Chip';
import Api from "../../utils/Api";
import PurchaseSelect from "./PurchaseSelect";

export default function PendingMembershipValidation({ user }: { user: User }): JSX.Element {
    if (user.membership.type === MembershipType.FTTH) {
        return <FTTHPendingMembershipValidation/>;
    } else if (user.membership.type === MembershipType.WIFI) {
        return <WifiPendingMembershipValidation/>;
    } else {
        return <Alert severity="error">
            Type d'adhésion inconnu
        </Alert>
    }
}

function PaymentStatus({ paid, display }: { paid: boolean, display: string }) {
    return (
        <div>
            <Typography variant="h6" color="text.secondary" component="div" align="left"
                        className="flex items-center">
                {paid ? <CheckCircleIcon color="success"/> :
                    <PendingIcon color="warning"/>}
                <span className="ml-2">
                    {display} : {paid ? "Paiement bien reçu !" : "À régler"}
                </span>
            </Typography>
        </div>
    );

}

function DolibarrPayment({ user }: { user: User }) {
    const { checkAuthStatus } = useAuthContext();
    const [polling, setPolling] = useState(false);
    const [opened, setOpened] = useState(false);
    const [creating, setCreating] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState(false);
    const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const paymentWindowRef = useRef<Window | null>(null);

    const scholarship = Boolean(user.scholarship_student);
    const ftthMonthly = scholarship ? 15 : 20;
    const wifiMonthly = scholarship ? 5 : 10;
    const availableItems: { itemId: string; displayName: string; price: number }[] = [];
    if (!user.membership.paid_first_month) {
        if (user.membership.type === MembershipType.FTTH)
            availableItems.push({ itemId: "first_month", displayName: "1er mois Fibre", price: ftthMonthly });
        else if (user.membership.type === MembershipType.WIFI)
            availableItems.push({ itemId: "first_month", displayName: "1er mois Wi-Fi", price: wifiMonthly });
    }
    if (user.membership.type === MembershipType.FTTH && user.membership.deposit_status !== DepositStatus.PAID) {
        availableItems.push({ itemId: "deposit", displayName: "Caution Matériel", price: 50 });
    }
    if (!user.membership.paid_membership) {
        availableItems.push({ itemId: "membership", displayName: "Cotisation annuelle", price: 1 });
    }

    const [itemsChecked, setItemsChecked] = useState<string[]>(availableItems.map(item => item.itemId));

    const handleCreateAndPay = useCallback(async () => {
        if (itemsChecked.length === 0) return;
        setCreating(true);
        try {
            const result = await Api.createSelectivePayment(itemsChecked);
            if (!result?.payment_url) {
                throw new Error("Lien de paiement introuvable");
            }
            // on garde un tag sur l'onglet pouyr tenter de le fermer
            paymentWindowRef.current = window.open(result.payment_url, "_blank");
            setOpened(true);
            setPolling(true);
            if (result.invoice_id) setPendingInvoiceId(String(result.invoice_id));
        } catch (e) {
            console.error("Error creating selective payment:", e);
        } finally {
            setCreating(false);
        }
    }, [itemsChecked]);

    const handleCancel = useCallback(async () => {
        setConfirmCancelOpen(false);
        setCancelling(true);
        setCancelError(false);

        const invoiceId = pendingInvoiceId;
        setOpened(false);
        setPolling(false);
        setPendingInvoiceId(null);

        // close l'onglet (best effort hein, ça marche sur bcp de navigatuers)
        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
            try { paymentWindowRef.current.close(); } catch { /* ignore */ }
        }
        paymentWindowRef.current = null;

        try {
            if (invoiceId) await Api.cancelInvoice(invoiceId);
        } catch (e) {
            console.error("Error cancelling invoice:", e);
            setCancelError(true);
        } finally {
            setCancelling(false);
        }
    }, [pendingInvoiceId]);

    // un fire and forget pour close les onglets + cancel les factures
    useEffect(() => {
        if (!pendingInvoiceId) return;
        const handler = () => {
            navigator.sendBeacon(`/api/payments/me/invoices/${pendingInvoiceId}/cancel`);
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [pendingInvoiceId]);

    useEffect(() => {
        if (!polling || !pendingInvoiceId) return;
        const interval = setInterval(async () => {
            try {
                const status = await Api.checkInvoicePaid(pendingInvoiceId);
                if (status.paid) {
                    setPolling(false);
                    await Api.pollDolibarrPaymentStatus();
                    await checkAuthStatus();
                }
            } catch (e) {
                console.error("Error polling invoice status:", e);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [polling, pendingInvoiceId, checkAuthStatus]);

    if (availableItems.length === 0) {
        return <Alert severity="success">Tous les paiements ont été effectués !</Alert>;
    }

    return <div className={"flex flex-col gap-2 sm:items-start items-stretch"}>
        <Typography variant="body1" color="text.secondary" component="p" align="left">
            Sélectionne les paiements que tu souhaites réaliser, puis clique sur le bouton pour être redirigé
            vers la page de paiement sécurisée.
        </Typography>
        <Paper elevation={2}>
            <PurchaseSelect availableItems={availableItems} itemsChecked={itemsChecked}
                            setItemsChecked={setItemsChecked} disabled={opened}/>
        </Paper>
        {!opened ? (
            <Button
                variant="contained"
                color="primary"
                startIcon={<CreditCardIcon/>}
                onClick={handleCreateAndPay}
                disabled={creating || itemsChecked.length === 0}
            >
                {creating ? "Création de la facture..." : "Payer en ligne"}
            </Button>
        ) : (
            <>
                <Typography variant="caption" color="error" display="block">
                    ⚠️ Si tu annules ou rafraîchis cette page, ferme tous les onglets de paiement ouverts.
                </Typography>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={cancelling}
                >
                    {cancelling ? "Annulation..." : "Annuler et changer la sélection"}
                </Button>
            </>
        )}
        <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)}>
            <DialogTitle>⚠️ Annuler le paiement</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    La facture va être annulée.<br/><br/>
                    <strong>Important :</strong> l'onglet de paiement va être fermé automatiquement.<br/><br/>
                    Si il est toujours ouvert, fermez-le manuellement !<br /><br />
                    Si vous payez sur un onglet après annulation, contactez rapidement <a href="mailto:support@rezel.net">support@rezel.net</a>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmCancelOpen(false)}>Revenir</Button>
                <Button onClick={handleCancel} color="error" variant="contained">
                    Annuler le paiement
                </Button>
            </DialogActions>
        </Dialog>
        {cancelError && (
            <Alert severity="error">
                Impossible d'annuler la facture. Ferme l'onglet de paiement manuellement pour éviter un paiement accidentel, puis réessaie.
            </Alert>
        )}
        {opened && polling && (
            <Alert severity="info" icon={<CircularProgress size="1.2em"/>}>
                Paiement ouvert dans un nouvel onglet. <strong>Ferme ce dernier si tu ne souhaites pas payer.</strong><br/>
                En attente de la confirmation...
            </Alert>
        )}
        {opened && !polling && (
            <Alert severity="success">
                Paiement confirmé !
            </Alert>
        )}
    </div>;
}


function ReglementInfo() {
    return <div className="flex flex-col gap-4 items-start">
        <Typography variant="body1" color="text.secondary" component="p" align="left">
            En adhérant à Rezel, tu t'engages à respecter le règlement intérieur de l'association.
        </Typography>
        <div className="flex flex-row gap-4">
            <Button target="_blank" rel="noopener noreferrer" variant="text" color="primary"
                    href="/static/RI_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon/>}>
                Réglement Intérieur
            </Button>
            <Button target="_blank" rel="noopener noreferrer" variant="text" color="primary"
                    href="/static/Statuts_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon/>}>
                Statuts de l'association
            </Button>
        </div>
    </div>
}

export function FTTHPendingMembershipValidation(): JSX.Element {
    let { user } = useAuthContext();
    const paidEverything = user.membership.deposit_status === DepositStatus.PAID &&
        user.membership.paid_first_month &&
        user.membership.paid_membership;

    return (
        <>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Demande d'adhésion Fibre
            </Typography>


            <div className="flex flex-col gap-8">
                <Typography variant="h5" color="text.secondary" component="div" align="left"
                            className="flex items-center">
                    {user.membership.contract_signed ? <CheckCircleIcon color="success"/> :
                        <PendingIcon color="warning"/>}
                    <span className="ml-2">
                        Contrat de fourniture de service
                    </span>
                </Typography>
                <ContractSignatureInfo user={user}/>


                <ReglementInfo/>

                <div className={"flex flex-col gap-2"}>
                    <div className={"mb-6"}>
                        <Typography variant="h5" color="text.secondary" component="div" align="left"
                                    className="flex items-center">
                            États des paiements
                        </Typography>
                    </div>

                    <div className={"pl-4 flex flex-col gap-4"}>
                        <PaymentStatus paid={user.membership.deposit_status === DepositStatus.PAID}
                                       display={"Caution matériel 50 €"}/>

                        <Typography variant="body1" color="text.secondary" component="p" align="left">
                            La caution vous sera restituée à la fin de votre adhésion en échange des équipements fournis.
                        </Typography>

                        <PaymentStatus paid={user.membership.paid_first_month}
                                       display={user.scholarship_student
                                           ? "Premier mois d'abonnement 15€ (puis 15€/mois) — tarif boursier"
                                           : "Premier mois d'abonnement 20€ (puis 20€/mois)"}/>
                        <Typography variant="body1" color="text.secondary" component="p" align="left">
                            Le premier mois d'abonnement est à régler dès maintenant.<br/>
                            Votre abonnement ne commencera qu'à partir de la date de votre rendez-vous d'installation.
                        </Typography>

                        <div>
                            <PaymentStatus paid={user.membership.paid_membership}
                                           display={"Cotisation 1€ (puis 1€/an)"}/>
                            <Typography variant="body1" color="text.secondary" component="p" align="left">
                                Vous devez régler votre cotisation pour un an. Être membre adhérent de Rezel est obligatoire pour bénéficier du service FAI.<br/>
                                Votre adhésion commencera le jour de la signature de votre contrat.<br/>
                                Elle est à renouveler chaque année à la date anniversaire de votre adhésion.
                            </Typography>
                        </div>
                    </div>
                </div>

                {!paidEverything && <PaymentInstructions user={user}/>}


                <Typography variant="h5" color="text.secondary" component="div" align="left"
                            className="flex items-center">
                    Et ensuite ?
                </Typography>
                <Typography variant="body1" color="text.secondary" component="p" align="justify">
                    Nous t'enverrons un mail dès que les paiements auront été vérifiés. Ensuite,
                    tu pourras récupèrer tes équipements (Box Internet), et nous
                    te demanderons un créneau pendant lequel tu es disponible pour qu'un technicien
                    mandaté par Orange procède à l'installation de la fibre. Cette étape est obligatoire
                    car les infrastructures FTTH (Fibre To The Home) sont mutualisées. Ton adhésion
                    commencera le jour de l'installation de la fibre, et nous te demanderons de régler
                    ton abonnement de {user.scholarship_student ? "15€" : "20€"} tous les mois à partir de ce moment.
                    <br/>
                    <br/>
                    Si tu as la moindre question, n'hésites pas à paser au local de l'association,
                    ou bien à envoyer un mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a>
                </Typography>
            </div>
        </>
    );
}

export function WifiPendingMembershipValidation(): JSX.Element {
    let { user } = useAuthContext();
    const paidEverything = user.membership.deposit_status === DepositStatus.PAID &&
        user.membership.paid_first_month &&
        user.membership.paid_membership;

    return (
        <>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Demande d'adhésion Wi-Fi
            </Typography>


            <div className="flex flex-col gap-8">
                <Typography variant="h5" color="text.secondary" component="div" align="left"
                            className="flex items-center">
                    {user.membership.contract_signed ? <CheckCircleIcon color="success"/> :
                        <PendingIcon color="warning"/>}
                    <span className="ml-2">
                        Contrat de fourniture de service
                    </span>
                </Typography>
                <ContractSignatureInfo user={user}/>


                <ReglementInfo/>

                <div className={"flex flex-col gap-2"}>
                    <div className={"mb-6"}>
                        <Typography variant="h5" color="text.secondary" component="div" align="left"
                                    className="flex items-center">
                            États des paiements
                        </Typography>
                    </div>

                    <div className={"pl-4 flex flex-col gap-4"}>
                        <PaymentStatus paid={user.membership.paid_first_month}
                                       display={user.scholarship_student
                                           ? "Premier mois d'abonnement 5€ (puis 5€/mois) — tarif boursier"
                                           : "Premier mois d'abonnement 10€ (puis 10€/mois)"}/>
                        <Typography variant="body1" color="text.secondary" component="p" align="left">
                            Le premier mois d'abonnement est à régler dès maintenant.<br/>
                            Votre abonnement ne commencera qu'à partir de la date de votre rendez-vous d'installation.
                        </Typography>

                        <div>
                            <PaymentStatus paid={user.membership.paid_membership}
                                           display={"Cotisation 1€ (puis 1€/an)"}/>
                            <Typography variant="body1" color="text.secondary" component="p" align="left">
                                Vous devez régler votre cotisation pour un an. Être membre adhérent de Rezel est obligatoire pour bénéficier du service FAI.<br/>
                                Votre adhésion commencera le jour de la signature de votre contrat.<br/>
                                Elle est à renouveler chaque année à la date anniversaire de votre adhésion.
                            </Typography>
                            {!user.membership.paid_membership && <Alert className={"text-left"} severity={"warning"}>Nous ne vérifions pas automatiquement
                                que la cotisation a été prise en compte. Si tu as déjà cotisé à
                                l'association, il n'est pas nécessaire de le faire de nouveau</Alert>}
                        </div>
                    </div>
                </div>

                {!paidEverything && <PaymentInstructions user={user}/>}



                <Typography variant="h5" color="text.secondary" component="div" align="left"
                            className="flex items-center">
                    Et ensuite ?
                </Typography>
                <Typography variant="body1" color="text.secondary" component="p" align="justify">
                    Nous t'enverrons un mail dès que les paiements auront été vérifiés. Ensuite,
                    tu recevras un mail te confirmant qu'un nouveau réseau Wi-Fi a été crée pour toi,
                    et nous te demanderons de régler ton abonnement de {user.scholarship_student ? "5€" : "10€"} tous les mois à partir de ce moment.
                    <br/>
                    <br/>
                    Si tu as la moindre question, n'hésites pas à paser au local de l'association,
                    ou bien à envoyer un mail à <a href="mailto:fai@rezel.net">fai@rezel.net</a>
                </Typography>
            </div>
        </>
    );
}

function PaymentInstructions({user}: {user: User}) {
    return <div>
        <Typography variant={"h5"} color={"text.secondary"} component={"div"} align={"left"}>
            Comment payer ? </Typography>
        <Typography variant="body1" color="text.secondary" component="p" align="justify">
            Tu as le choix entre plusieurs méthodes pour chaque paiement :
        </Typography>

        <div className={"pl-4 mt-4 flex flex-col"}>
                <Accordion defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel-dolibarr-content"
                        id="panel-dolibarr-header"
                    >
                    <Typography variant={"h6"} color={"text.secondary"} component={"div"} align={"left"} className="flex items-center gap-2">
                        <CreditCardIcon/> Carte bancaire
                        <Chip label="Recommandé" color="primary" size={"small"}/>
                    </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <DolibarrPayment user={user}/>
                    </AccordionDetails>
                </Accordion>


            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                <Typography variant={"h6"} color={"text.secondary"} component={"div"} align={"left"} className="flex items-center gap-2">
                    <PaymentsIcon/> Par chèque ou espèce</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <ChequePaymentInfo/>
                </AccordionDetails>
            </Accordion>


            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                <Typography variant={"h6"} color={"text.secondary"} component={"div"} align={"left"} className="flex items-center gap-2">
                    <AccountBalanceIcon/> Par virement bancaire</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <VirementPaymentInfo/>
                </AccordionDetails>
            </Accordion>
        </div>
    </div>
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
                    startIcon={<Launch/>}
                >
                    Signer le contrat en ligne
                </Button>
            </div>
        );
    else
        return (
            <div className="flex flex-col gap-4 items-start">
                <Typography variant="body1" color="text.secondary" component="p" align="left">
                    Un mail t'a été envoyé avec le contrat de fourniture de service pré-rempli. <br/>
                    Merci de le signer et de le renvoyer à <a href="mailto:fai@rezel.net">fai@rezel.net</a>.
                </Typography>
            </div>
        );
}


function ChequePaymentInfo() {
    return <Typography variant="body1" color="text.secondary" component="p" align="left">
        Tu peux payer <strong>par chèque ou par espèce</strong>. <br/>
        Dans ce cas, merci de passer au local de l'association, qui se trouve en salle 0A316 à Télécom Paris (19
        Place Marguerite Perey). <br/>

        <br/>
        Pour s'assurer de la présence d'un bénévole, envoie nous un mail à <a
        href="mailto:fai@rezel.net">fai@rezel.net</a> en précisant à quelle heure tu souhaites passer.
    </Typography>
}

function VirementPaymentInfo() {
    return <div className="flex flex-col gap-4 items-start">
        <Typography variant="body1" color="text.secondary" component="p" align="left">
            Tu peux payer <strong>par virement bancaire</strong>.<br/>
            ⚠️ Dans ce cas, tu dois impérativement mentionner <strong>ton nom et prénom dans le libellé du
            virement.</strong><br/>
        </Typography>
        <Button target="_blank" rel="noopener noreferrer" variant="contained" color="primary"
                href="/static/RIB_Rezel.pdf" className="mt-2" startIcon={<DownloadIcon/>}>
            Télécharger le RIB de Rezel
        </Button>
    </div>
}