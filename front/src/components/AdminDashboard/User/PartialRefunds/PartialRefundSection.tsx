import { TextField, Typography } from '@mui/material';
import { Control, Controller, FormState } from 'react-hook-form';
import { Membership, User } from '../../../../utils/types/types';
import AttachedAdherents from './AttachedAdherents';

export default function PartialRefundSection({ user, setUser}: { user: User, setUser: (user: User) => void }) {
    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Calcul des remboursements partiels
            </Typography>
            <Typography variant="subtitle2" align="justify" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                Les informations présentes dans cette section sont automatiquement mises à jour lors
                de la création et la suppression d'un UNet pour un adhérent Wi-Fi. Cependant, elles ne
                sont PAS automatiquement réconciliées avec l'état réel de la configuration du réseau.
                Ce sont des informations ayant pour but de faciliter la trésorerie, et aucun changement
                ou suppression dans cette section n'aura d'effet secondaire sur le réseau.
            </Typography>
            
            <AttachedAdherents user={user} setUser={setUser} />
        </div>
    );
};