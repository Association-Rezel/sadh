import { useEffect, useState } from "react";
import {
    Alert,
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
} from "@mui/material";
import { Link } from "react-router-dom";
import Api, { OverdueEntry } from "../../../utils/Api";
import { User } from "../../../utils/types/types";

type ReminderType = "subscription" | "cotisation";

function formatAmount(amount: number): string {
    return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function formatLastReminder(ts: number | null): string {
    if (!ts) return "—";
    const d = new Date(ts * 1000);
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    const dateStr = d.toLocaleDateString("fr-FR");
    if (days === 0) return `${dateStr} (aujourd'hui)`;
    if (days === 1) return `${dateStr} (hier)`;
    return `${dateStr} (il y a ${days}j)`;
}

export default function Overdue() {
    const [loading, setLoading] = useState(true);
    const [subscriptionExpired, setSubscriptionExpired] = useState<OverdueEntry[]>([]);
    const [cotisationExpired, setCotisationExpired] = useState<OverdueEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const [bulkLoading, setBulkLoading] = useState<Record<ReminderType, boolean>>({
        subscription: false,
        cotisation: false,
    });

    const remindApi: Record<ReminderType, (userId: string) => Promise<unknown>> = {
        subscription: (id) => Api.remindOverdueSubscription(id),
        cotisation: (id) => Api.remindOverdueCotisation(id),
    };
    const remindAllApi: Record<ReminderType, () => Promise<unknown>> = {
        subscription: () => Api.remindAllOverdueSubscription(),
        cotisation: () => Api.remindAllOverdueCotisation(),
    };

    const refresh = async () => {
        setLoading(true);
        try {
            const data = await Api.fetchOverdueUsers();
            setSubscriptionExpired(data.subscription_expired);
            setCotisationExpired(data.cotisation_expired);
        } catch (e: any) {
            setError(e.message || "Erreur lors du chargement des impayés");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const markPending = (id: string, pending: boolean) => {
        setPendingIds((prev) => {
            const next = new Set(prev);
            if (pending) next.add(id); else next.delete(id);
            return next;
        });
    };

    const handleRemind = async (user: User, type: ReminderType) => {
        markPending(user.id, true);
        try {
            await remindApi[type](user.id);
            await refresh();
        } catch (e: any) {
            setError(e.message || "Erreur lors du rappel");
        } finally {
            markPending(user.id, false);
        }
    };

    const handleRemindAll = async (type: ReminderType) => {
        setBulkLoading((prev) => ({ ...prev, [type]: true }));
        try {
            await remindAllApi[type]();
            await refresh();
        } catch (e: any) {
            setError(e.message || "Erreur lors du rappel groupé");
        } finally {
            setBulkLoading((prev) => ({ ...prev, [type]: false }));
        }
    };

    if (loading) {
        return <div className="flex justify-center"><CircularProgress /></div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <Typography variant="h4">Impayés</Typography>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

            <OverdueTable
                title="Abonnement expiré"
                description="Abonnés dont la période de service payée est terminée."
                entries={subscriptionExpired}
                pendingIds={pendingIds}
                onRemind={(u) => handleRemind(u, "subscription")}
                onRemindAll={() => handleRemindAll("subscription")}
                bulkLoading={bulkLoading.subscription}
                bulkLabel="Relancer tous les abonnements"
                actionLabel="Relancer"
            />

            <OverdueTable
                title="Cotisation expirée"
                description="Adhérents dont la cotisation annuelle est arrivée à échéance."
                entries={cotisationExpired}
                pendingIds={pendingIds}
                onRemind={(u) => handleRemind(u, "cotisation")}
                onRemindAll={() => handleRemindAll("cotisation")}
                bulkLoading={bulkLoading.cotisation}
                bulkLabel="Relancer toutes les cotisations"
                actionLabel="Relancer"
            />
        </div>
    );
}

function OverdueTable({
    title,
    description,
    entries,
    pendingIds,
    onRemind,
    onRemindAll,
    bulkLoading,
    bulkLabel,
    actionLabel,
}: {
    title: string;
    description: string;
    entries: OverdueEntry[];
    pendingIds: Set<string>;
    onRemind: (user: User) => void;
    onRemindAll: () => void;
    bulkLoading: boolean;
    bulkLabel: string;
    actionLabel: string;
}) {
    return (
        <div className="flex flex-col gap-4">
            <Typography variant="h5">{title} ({entries.length})</Typography>
            <Typography variant="body2" color="text.secondary">{description}</Typography>
            {entries.length === 0 ? (
                <Alert severity="success">Aucun impayé</Alert>
            ) : (
                <>
                    <div>
                        <Button
                            variant="contained"
                            color="warning"
                            disabled={bulkLoading}
                            onClick={onRemindAll}
                            startIcon={bulkLoading ? <CircularProgress size={18} color="inherit" /> : null}
                        >
                            {bulkLoading ? "Envoi en cours..." : bulkLabel}
                        </Button>
                    </div>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Montant dû</TableCell>
                                    <TableCell>Dernière relance</TableCell>
                                    <TableCell align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entries.map(({ user: u, amount_owed, last_reminder_at }) => {
                                    const isPending = pendingIds.has(u.id);
                                    return (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <Link to={`/admin/users/${u.id}`} style={{ color: "inherit" }}>
                                                    {u.first_name} {u.last_name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.membership?.type ?? "-"}</TableCell>
                                            <TableCell align="right">{formatAmount(amount_owed)}</TableCell>
                                            <TableCell>{formatLastReminder(last_reminder_at)}</TableCell>
                                            <TableCell align="center">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    disabled={isPending || bulkLoading}
                                                    onClick={() => onRemind(u)}
                                                    startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : null}
                                                >
                                                    {isPending ? "Envoi..." : actionLabel}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </div>
    );
}
