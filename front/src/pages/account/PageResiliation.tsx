import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Container, List, ListItem, ListItemIcon, ListItemText, Divider, Grid } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EuroIcon from '@mui/icons-material/Euro';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuthContext } from '../auth/AuthContext';
import dayjs from 'dayjs';

export default function PageResiliation() {
    const { user } = useAuthContext();
    const [resiliationDate, setResiliationDate] = useState('');

    const minDate = dayjs().add(7, 'day').format('YYYY-MM-DD');

    const handleMailto = () => {
        const subject = encodeURIComponent('Demande de résiliation');
        
        let userInfo = '';
        if (user) {
            userInfo = `\n\nPour faciliter le traitement de ma demande, voici mes informations :\n- Nom et prénom : ${user.first_name} ${user.last_name}\n- Type d'abonnement : ${user.membership?.type || 'Non renseigné'}`;
        }

        const formattedDate = resiliationDate ? dayjs(resiliationDate).format('DD/MM/YYYY') : '[Date de résiliation]';

        const body = encodeURIComponent(`Bonjour l'équipe Rezel,\n\nPar la présente, je vous informe de ma volonté de résilier mon abonnement internet.\n\nJe souhaiterais que cette résiliation soit effective à partir du ${formattedDate}.${userInfo}\n\nJe vous remercie par avance de bien vouloir me confirmer la prise en compte de cette demande.\n\nCordialement,\n${user ? `${user.first_name} ${user.last_name}` : ''}`);
        window.location.href = `mailto:fai@rezel.net?subject=${subject}&body=${body}`;
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Résilier mon abonnement
                </Typography>
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Générer votre demande par email
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                C'est la méthode la plus simple. Sélectionnez la date de fin souhaitée pour préparer automatiquement votre email.
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 3, mb: 4 }}>
                                <TextField
                                    type="date"
                                    label="Date de fin souhaitée"
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ min: minDate }}
                                    value={resiliationDate}
                                    onChange={(e) => setResiliationDate(e.target.value)}
                                    sx={{ minWidth: 220 }}
                                    size="small"
                                />
                                <Button 
                                    variant="contained" 
                                    onClick={handleMailto}
                                    endIcon={<SendIcon />}
                                    disabled={!resiliationDate}
                                >
                                    Préparer l'email
                                </Button>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Autres moyens de contact
                            </Typography>
                            <List dense>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 40 }}><SupportAgentIcon color="action" /></ListItemIcon>
                                    <ListItemText 
                                        primary="Ouvrir un ticket" 
                                        secondary={<a href="https://support.rezel.net" target="_blank" rel="noopener noreferrer">support.rezel.net</a>} 
                                    />
                                </ListItem>
                                <ListItem disableGutters>
                                    <ListItemIcon sx={{ minWidth: 40 }}><MailOutlineIcon color="action" /></ListItemIcon>
                                    <ListItemText 
                                        primary="Courrier recommandé" 
                                        secondary="Rezel, 19 Pl. Marguerite Perey, 91120 Palaiseau" 
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, height: '100%', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }} elevation={0}>
                            <Typography variant="h6" gutterBottom>
                                À savoir avant de résilier
                            </Typography>
                            <List>
                                <ListItem disablePadding sx={{ mb: 2, alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}><AccessTimeIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">Préavis de 7 jours</Typography>} 
                                        secondary="La résiliation prend effet au minimum 7 jours après la réception de votre demande." 
                                    />
                                </ListItem>
                                <ListItem disablePadding sx={{ mb: 2, alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}><EuroIcon color="primary" /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">Mois entamé</Typography>} 
                                        secondary="Tout mois d'abonnement commencé est dû dans sa totalité." 
                                    />
                                </ListItem>
                                <ListItem disablePadding sx={{ mb: 2, alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}><WarningAmberIcon color="warning" /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">Arrêt des paiements</Typography>} 
                                        secondary="Arrêter vos paiements ne vaut pas résiliation. Les sommes continueront de vous être facturées." 
                                    />
                                </ListItem>
                                <ListItem disablePadding sx={{ alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}><CheckCircleOutlineIcon color="success" /></ListItemIcon>
                                    <ListItemText 
                                        primary={<Typography fontWeight="bold">Confirmation</Typography>} 
                                        secondary="Votre résiliation sera définitive une fois que vous aurez reçu notre email de confirmation." 
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}
