import { useContext, useEffect, useState } from "react";
import { PartialRefund, User } from "../../utils/types/types";
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Input, InputAdornment, InputLabel, List, ListItem, TextField, Tooltip, Typography } from "@mui/material";
import dayjs from 'dayjs';
import { Controller, useForm } from "react-hook-form";
import { Check, Delete, Error, Refresh } from "@mui/icons-material";
import { Link } from "react-router-dom";
import ConfirmableButton from "../utils/ConfirmableButton";
import Api from "../../utils/Api";

export default function PartialRefunds() {
    const [partialRefunds, setPartialRefunds] = useState<PartialRefund[] | null>(null);
    const [users, setUsers] = useState<User[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false)
    const [computeMessage, setComputeMessage] = useState<string>("")
    const [showPaid, setShowPaid] = useState<boolean>(false);

    useEffect(() => {
        Api.fetchAllPartialRefunds().then(setPartialRefunds).catch(alert);
        Api.fetchUsers().then(setUsers).catch(alert);
    }, []);

    const computeToDate = () => {
        setLoading(true);
        Api.computePartialRefunds()
            .then((response) => {
                setComputeMessage(response["message"])
                Api.fetchAllPartialRefunds()
                    .then(setPartialRefunds)
                    .catch(alert)
            })
            .catch(alert)
            .finally(() => setLoading(false));
    }

    const conflicts = partialRefunds && users ? findConflictingRefunds(partialRefunds.filter(p => p.wifi_adherents.length != 0), users) : [];

    return (
        <div className="flex flex-col gap-8">
            {users == null || partialRefunds == null && <CircularProgress />}
            <Button onClick={computeToDate} color="success" disabled={loading} variant="contained" startIcon={<Refresh />}>
                Calculer les remboursements partiels jusqu'à aujourd'hui
            </Button>
            <Typography variant="subtitle1" align="left">
                L'algorithme se base sur la date de début d'adhésion de chaque adhérent FTTH
                (indiqué sur sa page adhérent sur ce site), et sur la liste des adhérents Wi-Fi
                attachés à chaque période.<br />
                <br />
                Pour chaque mois d'adhésion de l'adhérent FTTH, on calcule la somme des adhérents Wi-Fi
                entièrement présents sur le mois. Si aucun objet "Remboursement partiel" n'existe déjà
                pour ce mois d'adhésion, alors un objet est crée pour ce mois.<br />
                <br />
                Les objets "Remboursement partiel" avec aucun adhérent Wi-Fi ne sont pas affichés sur cette
                page, pour ne pas la surcharger. Ils sont cependant bien créés dans la base de données.
            </Typography>

            {computeMessage && <Alert severity="warning">
                <pre className="text-left">
                    {computeMessage}
                </pre>
            </Alert>}

            {conflicts.length > 0 &&
                <Alert severity="error">
                    <Typography variant="h6">
                        Remboursements partiels en double
                    </Typography>
                    <Typography variant="subtitle1" align="left">
                        Les utilisateurs suivants ont plusieurs remboursements partiels pour la même
                        période, ou bien des remboursements partiels déjà payés pour des périodes
                        similaires.<br />
                        <br />
                        Cela peut être dû au changement de date d'adhésion de l'adhérent FTTH par exemple.
                        Attention à bien vérifier si les remboursements partiels sont valides ou non.<br />
                        <br />
                    </Typography>
                    <List>
                        {conflicts.map(user => <ListItem key={user.id}>
                            <Typography variant="body1">
                                <Error /> {user.first_name} {user.last_name}
                            </Typography>
                        </ListItem>)}
                    </List>
                </Alert>
            }
            <Alert severity="info">
                {users && partialRefunds && partialRefunds.filter(p => !p.paid && p.wifi_adherents.length === 0).length || <CircularProgress />} cartes sont masquées
                car elles concernent des mois d'adhésions FTTH avec aucun adhérent Wi-Fi à rembourser.
            </Alert>
            <Alert severity="warning">
                Les cartes à traiter sont susceptibles d'être supprimées et recalculées automatiquement
                lors d'un nouveau calcul des remboursements partiels (Bouton tout en haut)
            </Alert>
            <h2>
                Montant total des remboursements partiels par adhérent
            </h2>
            <div className="grid gap-6 2xl:grid-cols-2 place-items-center">
                {users && partialRefunds && users
                    .filter(user =>
                        partialRefunds.some(refund => refund.user_id === user.id && !refund.paid && refund.wifi_adherents.length > 0)
                    )
                    .map(user => {
                        const remainingRefund = partialRefunds
                            .filter(refund => refund.user_id === user.id && !refund.paid && refund.wifi_adherents.length > 0)
                            .reduce((sum, refund) => sum + refund.refunded_amount, 0);

                        return (
                            <div key={user.id} className="xl:min-w-[35rem]">
                                <UserPartialRefunds
                                    user={user}
                                    remainingRefund={remainingRefund}
                                    setPartialRefunds={setPartialRefunds}
                                />
                            </div>
                        );
                    })
                }
            </div>
            <h2>
                Détail des remboursements partiels
            </h2>
            <div className="grid gap-6 2xl:grid-cols-2 place-items-center">
                {users && partialRefunds && partialRefunds.filter(p => !p.paid && p.wifi_adherents.length > 0).map((partialRefund) =>
                    <div key={partialRefund.id} className="xl:min-w-[35rem]">
                        <PartialRefundCard
                            users={users}
                            partialRefund={partialRefund}
                            setPartialRefund={(newP: PartialRefund) => setPartialRefunds(partialRefunds.map(p => p.id === partialRefund.id ? newP : p))}
                            deletePartialRefund={() => setPartialRefunds(partialRefunds.filter(p => p.id !== partialRefund.id))}
                            user={users.find(user => user.id === partialRefund.user_id)}
                        />
                    </div>
                )}
            </div>
            <h2
                style={{ cursor: "pointer" }}
                onClick={() => setShowPaid(prev => !prev)}
            >
                Payés
            </h2>
            {showPaid && (
                <div className="grid gap-6 2xl:grid-cols-2 place-items-center">
                    {users && partialRefunds && partialRefunds.filter(p => p.paid && p.wifi_adherents.length > 0).map((partialRefund) =>
                        <div key={partialRefund.id} className="xl:min-w-[35rem]">
                            <PartialRefundCard
                                users={users}
                                partialRefund={partialRefund}
                                setPartialRefund={(newP: PartialRefund) => setPartialRefunds(partialRefunds.map(p => p.id === partialRefund.id ? newP : p))}
                                deletePartialRefund={() => setPartialRefunds(partialRefunds.filter(p => p.id !== partialRefund.id))}
                                user={users.find(user => user.id === partialRefund.user_id)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function PartialRefundCard({ users, partialRefund, setPartialRefund, deletePartialRefund, user }: { users: User[], partialRefund: PartialRefund, setPartialRefund: (p: PartialRefund) => void, deletePartialRefund: () => void, user: User }) {
    const { register, handleSubmit, reset, formState, control, setValue } = useForm<PartialRefund>({
        defaultValues: partialRefund
    });

    const onSubmit = async (partialRefund: PartialRefund) => {
        try {
            setPartialRefund(await Api.updatePartialRefund(partialRefund));
            reset(partialRefund);
        } catch (error) {
            alert(error.message);
        }
    }

    const onSubmitPaid = async (partialRefund: PartialRefund) => {
        try {
            setPartialRefund(await Api.updatePartialRefund({ ...partialRefund, paid: true }));
        } catch (error) {
            alert(error.message);
        }
    }

    const month_start = dayjs(partialRefund.membership_start.getTime()).add(partialRefund.month, 'month');
    const month_end = month_start.add(1, 'month');

    return (
        <Card>
            <CardContent>
                <div className="relative">
                    {partialRefund.paid &&
                        <>
                            <Chip className="asbolute float-left" label="Payé" sx={{ backgroundColor: '#b3e6b5', color: 'black' }} />
                            <div className="absolute right-0">
                                <ConfirmableButton
                                    confirmationText={
                                        <p>
                                            Il est impossible de revenir en arrière après avoir supprimé un remboursement partiel. <br />
                                            <br />
                                            Un nouveau remboursement partiel sera sans doute crée à la place de celui-ci
                                            lors du prochain recalcul, alors assurez-vous de savoir ce que vous faites.
                                        </p>}
                                    onConfirm={() => Api.deletePartialRefund(partialRefund.id).then(deletePartialRefund).catch(alert)}
                                    buttonColor="error"
                                    type="iconbutton"
                                >
                                    <Delete />
                                </ConfirmableButton>
                            </div>
                        </>
                    }
                    <Typography variant="h6">
                        <Link to={`/admin/users/${user.id}`} style={{ color: 'inherit' }}>
                            <Tooltip title="Voir la fiche de l'adhérent" placement="right">
                                <span className="mr-6 hover:underline">
                                    {user.first_name} {user.last_name}
                                </span>
                            </Tooltip>
                        </Link>
                        <Tooltip title={`Adhésion FTTH entre le ${month_start.format("DD/MM/YYYY")} et le ${month_end.format("DD/MM/YYYY")}`} placement="right">
                            <Chip label={dayjs(month_start).locale('fr').format('MMMM YYYY')} />
                        </Tooltip>
                    </Typography>
                </div>
                <div className="flex flex-col gap-6 mt-4">
                    <Typography variant="body1">
                        <Tooltip title={
                            <p>Adhérents Wi-Fi attachés à cette période :
                                {partialRefund.wifi_adherents.map((wifi_adherent, index) =>
                                    <span key={index} className="block">
                                        {users.find(u => u.id === wifi_adherent)?.first_name} {users.find(u => u.id === wifi_adherent)?.last_name}
                                    </span>
                                )}
                            </p>} placement="right">
                            <span>{partialRefund.wifi_adherents.length} adhérent(s) Wi-Fi</span>
                        </Tooltip>
                    </Typography>
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => <TextField {...field} label="Commentaire" multiline minRows={3} />}
                    />
                    <div className="flex lg:flex-row flex-col justify-end">
                        <div className="flex flex-row items-baseline gap-6">
                            <div>Montant du remboursement</div>
                            <div className="max-w-16 mr-6">
                                <Controller
                                    name="refunded_amount"
                                    control={control}
                                    render={({ field }) =>
                                        <Input
                                            {...field}
                                            type="number"
                                            endAdornment={<InputAdornment position="end">€</InputAdornment>}
                                        />}
                                />
                            </div>
                        </div>
                        <Button disabled={!formState.isDirty || formState.isSubmitting} onClick={handleSubmit(onSubmit)}>Enregistrer</Button>
                        <Button disabled={formState.isSubmitting || partialRefund.paid} startIcon={<Check />} color="success" onClick={handleSubmit(onSubmitPaid)}>Payé !</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function UserPartialRefunds({ user, remainingRefund, setPartialRefunds }: { user: User, remainingRefund: number, setPartialRefunds: (p: PartialRefund[]) => void, }) {


    const onSubmitPaid = async (user_id: string) => {
        await Api.payUserPartialRefunds(user_id).catch(alert);
        await Api.fetchAllPartialRefunds().then(setPartialRefunds).catch(alert);
    }
    return (
        <Card>
            <CardContent>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", flexGrow: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={`${user.first_name} ${user.last_name}`}
                    >
                        {user.first_name} {user.last_name}
                    </Typography>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                            {remainingRefund} €
                        </Typography>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<Check />}
                            onClick={() => { onSubmitPaid(user.id) }}
                            disabled={remainingRefund === 0}
                            sx={{ minWidth: 100 }}
                        >
                            Payé !
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
function findConflictingRefunds(partialRefunds: PartialRefund[], users: User[]) {
    const conflicts: User[] = [];

    const refundsByUser = partialRefunds.reduce((acc, refund) => {
        acc[refund.user_id] = acc[refund.user_id] || [];
        acc[refund.user_id].push(refund);
        return acc;
    }, {} as { [userId: string]: PartialRefund[] });

    for (const userId in refundsByUser) {
        const refunds = refundsByUser[userId];
        if (refunds.length < 2) {
            continue
        }

        for (let i = 0; i < refunds.length; i++) {
            if (conflicts.filter(u => u.id == userId).length > 0)
                break;

            for (let j = i + 1; j < refunds.length; j++) {
                const refund1 = refunds[i];
                const refund2 = refunds[j];

                const start1 = dayjs(refund1.membership_start).add(refund1.month, 'month');
                const end1 = start1.add(1, 'month');
                const start2 = dayjs(refund2.membership_start).add(refund2.month, 'month');
                const end2 = start2.add(1, 'month');

                const hasOverlap = start1.isBefore(end2) && end1.isAfter(start2);

                if (hasOverlap && (!refund1.paid || !refund2.paid)) {
                    const user = users.find(u => u.id === refund1.user_id);
                    if (user) {
                        conflicts.push(user);
                    }
                    break
                }
            }
        }
    }
    return conflicts;
}