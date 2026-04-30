import { useEffect, useState } from "react";
import { MembershipStatus, User, StatusUpdateInfo } from "../../../utils/types/types";
import Api from "../../../utils/Api";
import { Button, CircularProgress, Typography } from "@mui/material";
import { Close, Check, AutoMode } from "@mui/icons-material";


export default function StatusUpdateSection({ user, setUser }: { user: User, setUser: (user: User) => void }) {
    if (!user) return (<>Chargement...</>);

    const [nextUpdate, setNextUpdate] = useState<StatusUpdateInfo>(null)
    const [loading, setLoading] = useState<boolean>(true);
    const [updating, setUpdating] = useState<boolean>(false);

    useEffect(() => {
        Api.fetchNextMembershipStatus(user.id).then((update) => {
            setNextUpdate(update)
        }).finally(() => {
            setLoading(false);
        });
    }, [user])

    const onUpdate = (status: MembershipStatus) => {
        setUpdating(true);
        Api.updateMembershipStatus(user.id, status).then((updatedUser) => {
            if (updatedUser == null) {
                alert("Erreur lors de la modification.");
                return;
            }
            setUser(updatedUser);
        }).catch((error) => {
            alert("Erreur lors de la modification. Message d'erreur : " + error.message);
        }).finally(() => {
            setUpdating(false);
        });
    }

    if(loading) return (<>Chargement...</>);

    if(!loading && !nextUpdate) return (<div className="mt-10 max-w-xs">Aucun changement d'état possible</div>);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Changement d'état de l'abonnement
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                <div className="flex flex-col gap-y-2">
                    <strong>Conditions</strong>
                    {nextUpdate && nextUpdate.conditions.map((condition) =>
                        <span key={condition}>{nextUpdate.conditions_not_met.includes(condition) ? <Close color="error" /> : <Check color="success" />} {condition}</span>
                    )}
                    <strong>Effets lors du changement d'état</strong>
                    {nextUpdate && nextUpdate.effects.map((action) =>
                        <span key={action}><AutoMode /> {action}</span>
                    )}
                </div>
                <div className="pt-4">
                    <Button
                        disabled={nextUpdate.conditions_not_met.length !== 0 || updating}
                        onClick={() => onUpdate(nextUpdate.to_status)}
                        variant="contained"
                        color="warning"
                        startIcon={updating ? <CircularProgress size={18} color="inherit" /> : null}>
                        {updating ? "Application en cours..." : `Passer à l'état suivant (${MembershipStatus[nextUpdate.to_status]})`}
                    </Button>
                </div>
            </Typography>
        </div>
    )
}
