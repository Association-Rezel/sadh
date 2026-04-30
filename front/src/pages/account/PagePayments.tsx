import { useEffect, useState, useRef, useCallback, MutableRefObject } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Link as MuiLink,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import Api from "../../utils/Api";
import { useAuthContext } from "../auth/AuthContext";
import { MembershipType } from "../../utils/types/types";

interface Invoice {
    id: string;
    ref: string;
    date: number;
    date_lim_reglement: number;
    total_ttc: string;
    remaintopay: string;
    statut: string;
    lines?: InvoiceLine[];
}

interface InvoiceLine {
    description: string;
    total_ttc: string;
}

function formatDate(timestamp: number | string | undefined): string {
    if (!timestamp) return "-";
    const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
    if (isNaN(ts) || ts === 0) return "-";
    return new Date(ts * 1000).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatAmount(amount: string | number | undefined): string {
    if (amount === undefined || amount === null) return "-";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "-";
    return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function invoiceStatusLabel(statut: string): { label: string; color: "success" | "warning" | "error" | "default" } {
    switch (statut) {
        case "0": return { label: "Brouillon", color: "default" };
        case "1": return { label: "Impayée", color: "warning" };
        case "2": return { label: "Payée", color: "success" };
        case "3": return { label: "Abandonnée", color: "error" };
        default: return { label: "Inconnu", color: "default" };
    }
}

const MONTHLY_PRICES: Record<string, number> = {
    [MembershipType.WIFI]: 10,
    [MembershipType.FTTH]: 20,
};

const MONTHLY_PRICES_SCHOLARSHIP: Record<string, number> = {
    [MembershipType.WIFI]: 5,
    [MembershipType.FTTH]: 15,
};

function monthlyPrice(type: string | undefined, scholarship: boolean | undefined): number {
    if (!type) return 0;
    const table = scholarship ? MONTHLY_PRICES_SCHOLARSHIP : MONTHLY_PRICES;
    return table[type] ?? 0;
}

function AccountStatusAlert({
    label,
    endTs,
    expired,
    expiredMessage,
    validMessage,
    fallbackMessage,
}: {
    label: string;
    endTs: number | null;
    expired: boolean;
    expiredMessage: string;
    validMessage: string;
    fallbackMessage: string;
}) {
    const severity = expired ? "error" : endTs ? "success" : "info";
    const message = endTs ? (expired ? expiredMessage : validMessage) : fallbackMessage;
    if (expired) {
        return (
            <Alert
                severity="error"
                variant="filled"
                sx={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    py: 1.5,
                    border: "2px solid #b71c1c",
                }}
            >
                <strong> {label} :</strong> {message}
            </Alert>
        );
    }
    return (
        <Alert severity={severity}>
            <strong>{label} :</strong> {message}
        </Alert>
    );
}

export default function PagePayments() {
    const { user } = useAuthContext();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [archivedInvoices, setArchivedInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

    const [advanceMonths, setAdvanceMonths] = useState(1);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [pendingAdvanceInvoiceId, setPendingAdvanceInvoiceId] = useState<number | null>(null);
    const [advancePolling, setAdvancePolling] = useState(false);
    const [advanceCancelling, setAdvanceCancelling] = useState(false);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const paymentWindowRef = useRef<Window | null>(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    const [subscriptionEnd, setSubscriptionEnd] = useState<number | null>(null);
    const [totalMonthsPaid, setTotalMonthsPaid] = useState<number | null>(null);
    const [membershipEnd, setMembershipEnd] = useState<number | null>(null);
    const [pollingInvoiceId, setPollingInvoiceId] = useState<string | null>(null);
    const invoicePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refreshInvoices = useCallback(async () => {
        try {
            const invs = await Api.fetchMyInvoices();
            setInvoices(invs);
        } catch (e: any) {
            console.error("Error refreshing invoices:", e);
        }
    }, []);

    const refreshAccountState = useCallback(async () => {
        const subInfo = await Api.fetchSubscriptionInfo();
        setSubscriptionEnd(subInfo.subscription_end);
        setTotalMonthsPaid(subInfo.total_months_paid);
        setMembershipEnd(subInfo.membership_end);
        await refreshInvoices();
    }, [refreshInvoices]);

    const startInvoicePolling = useCallback(
        (
            invoiceId: string,
            ref: MutableRefObject<ReturnType<typeof setInterval> | null>,
            onPaid: () => Promise<void>,
        ) => {
            if (ref.current) clearInterval(ref.current);
            ref.current = setInterval(async () => {
                try {
                    await Api.pollDolibarrPaymentStatus();
                    const status = await Api.checkInvoicePaid(invoiceId);
                    if (status.paid) {
                        if (ref.current) clearInterval(ref.current);
                        ref.current = null;
                        await onPaid();
                    }
                } catch { /* ignore */ }
            }, 5000);
        },
        [],
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [, invs, archived, subInfo] = await Promise.all([
                    Api.fetchMySubscriptions(),
                    Api.fetchMyInvoices(),
                    Api.fetchMyArchivedInvoices(),
                    Api.fetchSubscriptionInfo(),
                ]);
                setInvoices(invs);
                setArchivedInvoices(archived);
                setSubscriptionEnd(subInfo.subscription_end);
                setTotalMonthsPaid(subInfo.total_months_paid);
                setMembershipEnd(subInfo.membership_end);
            } catch (e: any) {
                setError(e.message || "Erreur lors du chargement des paiements");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (invoicePollRef.current) clearInterval(invoicePollRef.current);
        };
    }, []);

    useEffect(() => {
        if (!pendingAdvanceInvoiceId) return;
        const handler = () => {
            navigator.sendBeacon(`/api/payments/me/invoices/${pendingAdvanceInvoiceId}/cancel`);
            if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
                try { paymentWindowRef.current.close(); } catch { /* ignore */ }
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [pendingAdvanceInvoiceId]);

    const handlePayInvoice = async (invoice: Invoice) => {
        try {
            setPayingInvoiceId(invoice.id);
            const response = await Api.fetchInvoicePaymentUrl(invoice.id);
            if (!response?.payment_url) {
                throw new Error("Lien de paiement introuvable");
            }
            window.open(response.payment_url, "_blank");
            setPollingInvoiceId(invoice.id);
            startInvoicePolling(invoice.id, invoicePollRef, async () => {
                setPollingInvoiceId(null);
                await refreshAccountState();
            });
        } catch (e: any) {
            setError(e.message || "Impossible de lancer le paiement");
        } finally {
            setPayingInvoiceId(null);
        }
    };

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setAdvancePolling(false);
    }, []);

    const handleAdvancePayment = async () => {
        try {
            setAdvanceLoading(true);
            setError(null);
            const response = await Api.createAdvancePayment(advanceMonths);
            if (!response?.payment_url || !response?.invoice_id) {
                throw new Error("Lien de paiement introuvable");
            }

            setPendingAdvanceInvoiceId(response.invoice_id);
            paymentWindowRef.current = window.open(response.payment_url, "_blank");
            setAdvancePolling(true);
            startInvoicePolling(
                String(response.invoice_id),
                pollIntervalRef,
                async () => {
                    setAdvancePolling(false);
                    setPendingAdvanceInvoiceId(null);
                    await refreshAccountState();
                },
            );
        } catch (e: any) {
            setError(e.message || "Impossible de créer la facture d'avance");
        } finally {
            setAdvanceLoading(false);
        }
    };

    const handleCancelAdvance = async () => {
        if (!pendingAdvanceInvoiceId) return;
        setConfirmCancelOpen(false);

        const invoiceId = pendingAdvanceInvoiceId;
        stopPolling();
        setPendingAdvanceInvoiceId(null);
        setAdvanceCancelling(true);

        if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
            try { paymentWindowRef.current.close(); } catch { /* ignore */ }
        }
        paymentWindowRef.current = null;

        try {
            await Api.cancelInvoice(String(invoiceId));
            await refreshInvoices();
        } catch (e: any) {
            setError(e.message || "Impossible d'annuler la facture");
        } finally {
            setAdvanceCancelling(false);
        }
    };

    const handleDownloadPdf = async (invoiceId: string) => {
        try {
            await Api.downloadInvoicePdf(invoiceId);
        } catch (e: any) {
            setError(e.message || "Impossible de télécharger la facture");
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Box>
        );
    }

    const noData = invoices.length === 0;
    const maxAdvanceMonths = totalMonthsPaid !== null ? Math.max(0, 12 - totalMonthsPaid) : 0;
    const canPayAdvance = totalMonthsPaid !== null && totalMonthsPaid > 0 && maxAdvanceMonths > 0;

    const nowTs = Math.floor(Date.now() / 1000);
    const cotisationExpired = membershipEnd !== null && membershipEnd < nowTs;
    const subscriptionExpired = subscriptionEnd !== null && subscriptionEnd < nowTs;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Mes paiements
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    État de votre compte
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <AccountStatusAlert
                        label="Cotisation (adhésion Rezel)"
                        endTs={membershipEnd}
                        expired={cotisationExpired}
                        expiredMessage={`expirée depuis le ${formatDate(membershipEnd)}`}
                        validMessage={`à jour jusqu'au ${formatDate(membershipEnd)}`}
                        fallbackMessage="aucune cotisation enregistrée"
                    />
                    <AccountStatusAlert
                        label="Abonnement (service FAI)"
                        endTs={subscriptionEnd}
                        expired={subscriptionExpired}
                        expiredMessage={`expiré depuis le ${formatDate(subscriptionEnd)}`}
                        validMessage={`${totalMonthsPaid} mois - valide jusqu'au ${formatDate(subscriptionEnd)}`}
                        fallbackMessage={
                            totalMonthsPaid !== null
                                ? `${totalMonthsPaid} mois payés (date de début non définie)`
                                : "aucun abonnement enregistré"
                        }
                    />
                </Box>
            </Paper>

            {noData && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Aucun historique de paiement trouvé. Contactez <a href="mailto:support@rezel.net">support@rezel.net</a>
                </Alert>
            )}

            {invoices.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                        Factures actuelles
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Référence</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Échéance</TableCell>
                                    <TableCell align="right">Montant TTC</TableCell>
                                    <TableCell align="right">Reste à payer</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoices.map((inv) => {
                                    const status = invoiceStatusLabel(inv.statut);
                                    const isUnpaid = inv.statut === "1";
                                    const isPaying = payingInvoiceId === inv.id;
                                    const isPolling = pollingInvoiceId === inv.id;

                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                {}
                                                <MuiLink
                                                    component="button"
                                                    onClick={() => handleDownloadPdf(inv.id)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    {inv.ref}
                                                </MuiLink>
                                            </TableCell>
                                            <TableCell>{formatDate(inv.date)}</TableCell>
                                            <TableCell>{formatDate(inv.date_lim_reglement)}</TableCell>
                                            <TableCell align="right">{formatAmount(inv.total_ttc)}</TableCell>
                                            <TableCell align="right">{formatAmount(inv.remaintopay)}</TableCell>
                                            <TableCell>
                                                <Chip label={status.label} color={status.color} size="small" />
                                            </TableCell>
                                            <TableCell align="center">
                                                {isUnpaid && parseFloat(inv.remaintopay) > 0 ? (
                                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() => handlePayInvoice(inv)}
                                                            disabled={isPaying || isPolling}
                                                        >
                                                            {isPaying ? "Redirection..." : "Payer"}
                                                        </Button>
                                                        {isPolling && (
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                <CircularProgress size={14} />
                                                                <Typography variant="caption">En attente...</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {archivedInvoices.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
                        Anciennes factures
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Factures liées à un abonnement antérieur.
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Référence</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell align="right">Montant TTC</TableCell>
                                    <TableCell>Statut</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {archivedInvoices.map((inv) => {
                                    const status = invoiceStatusLabel(inv.statut);
                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell>
                                                <MuiLink
                                                    component="button"
                                                    onClick={() => handleDownloadPdf(inv.id)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    {inv.ref}
                                                </MuiLink>
                                            </TableCell>
                                            <TableCell>{formatDate(inv.date)}</TableCell>
                                            <TableCell align="right">{formatAmount(inv.total_ttc)}</TableCell>
                                            <TableCell>
                                                <Chip label={status.label} color={status.color} size="small" />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {}
            {pendingAdvanceInvoiceId && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                        Facture d'avance en attente de paiement...
                        {advancePolling && <CircularProgress size={16} sx={{ ml: 1, verticalAlign: "middle" }} />}
                    </Typography>
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                        ⚠️ Si tu annules ou rafraîchis cette page, ferme tous les onglets de paiement ouverts.
                    </Typography>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setConfirmCancelOpen(true)}
                        disabled={advanceCancelling}
                        sx={{ mt: 1 }}
                    >
                        {advanceCancelling ? "Annulation..." : "Annuler la facture"}
                    </Button>
                </Alert>
            )}

            <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)}>
                <DialogTitle>⚠️ Annuler la facture</DialogTitle>
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
                    <Button onClick={handleCancelAdvance} color="error" variant="contained">
                        Annuler la facture
                    </Button>
                </DialogActions>
            </Dialog>

            {user?.membership?.type && !pendingAdvanceInvoiceId && totalMonthsPaid !== null && (
                <>
                    <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
                        Payer des mois en avance
                    </Typography>
                    {canPayAdvance ? (
                        <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <InputLabel>Nombre de mois</InputLabel>
                                <Select
                                    value={Math.min(advanceMonths, maxAdvanceMonths)}
                                    label="Nombre de mois"
                                    onChange={(e) => setAdvanceMonths(e.target.value as number)}
                                >
                                    {Array.from({ length: maxAdvanceMonths }, (_, i) => i + 1).map((n) => (
                                        <MenuItem key={n} value={n}>{n} mois</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Typography>
                                Total : {formatAmount(Math.min(advanceMonths, maxAdvanceMonths) * monthlyPrice(user.membership.type, user.scholarship_student))}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={handleAdvancePayment}
                                disabled={advanceLoading}
                            >
                                {advanceLoading ? "Création..." : "Créer la facture et payer"}
                            </Button>
                        </Paper>
                    ) : (
                        <Alert severity="success">
                            Vous êtes à jour pour l'année — aucun mois supplémentaire disponible.
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );
}
