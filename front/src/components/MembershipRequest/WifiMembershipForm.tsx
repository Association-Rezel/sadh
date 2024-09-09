import { Button, FormControlLabel, Typography, Checkbox, FormControl, InputLabel, Select, MenuItem, TextField, Radio, RadioGroup, FormLabel, FormHelperText, Alert, CircularProgress } from "@mui/material";
import { MembershipType, PaymentMethod, Residence, User } from "../../utils/types/types";
import { Api } from "../../utils/Api";
import { Controller, useForm } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useContext, useEffect, useState } from "react";
import { AppStateContext } from "../../utils/AppStateContext";

type FormValues = {
    residence: string;
    appartement_id: string;
    ssid: string;
    paymentMethodFirstMonth: string;
    paymentMethodDeposit: string;
};

export default function WifiMembershipForm() {
    const {
        register,
        handleSubmit,
        control,
        formState,
        watch,
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            ssid: "",
            residence: "",
            appartement_id: "",
            paymentMethodFirstMonth: "",
            paymentMethodDeposit: "",
        }
    });

    const { appState, updateAppState } = useContext(AppStateContext);
    const [allSSIDs, setAllSSIDs] = useState<string[]>([]);
    const [errorSSIDs, setErrorSSIDs] = useState<boolean>(false);
    const [loadingSSIDs, setLoadingSSIDs] = useState<boolean>(false);

    useEffect(() => {
        reset({
            residence: appState.user?.membership?.address.residence,
            appartement_id: appState.user?.membership?.address.appartement_id,
        });

    }, [appState.user]);

    useEffect(() => {
        Api.fetchAllSSIDs().then((ssids) => {
            setAllSSIDs(ssids);
        }).catch((error) => {
            setErrorSSIDs(true);
        }).finally(() => {
            setLoadingSSIDs(false);
        });
    }, []);

    const onSubmitMembership = async (event: FormValues) => {
        try {
            const user = await Api.submitMyMembershipRequest({
                type: MembershipType.WIFI,
                ssid: event.ssid,
                address: {
                    residence: Residence[event.residence],
                    appartement_id: event.appartement_id,
                },
                payment_method_first_month: PaymentMethod[event.paymentMethodFirstMonth],
            });
            updateAppState({ user: { ...user } });
        } catch (error) {
            alert(
                "Erreur lors de la demande d'adhésion. Veuillez réessayer ultérieurement. Message d'erreur : " +
                error.message +
                "\nSi le problème persiste, veuillez contacter contact@rezel.net"
            );
        }
    };

    return (
        <div>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                Adhérer à Rezel (Wi-Fi)
            </Typography>
            <form className="container mt-16 max-w-2xl" onSubmit={handleSubmit(onSubmitMembership)}>
                <div className="flex flex-col items-start">
                    <div className="mt-8 mb-12" >
                        <Typography variant="h5" color="text.primary" align="left">
                            Wi-Fi Rezel le plus proche
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Merci d'indiquer le réseau Wi-Fi Rezel-xxx que tu reçoies le mieux de chez toi.<br />
                            Nous créerons ensuite un nouveau Wi-Fi complètement séparé sur le même équipement physique.<br />
                            Tu auras ton propre réseau et ta propre adresse IP publique complètement séparés du réseau que
                            tu indiques ci-dessous.
                        </Typography>
                    </div>
                    {loadingSSIDs &&
                        <CircularProgress />
                    }
                    {errorSSIDs && <Alert severity="error">Erreur lors du chargement des réseaux Wi-Fi, veuillez contacer fai@rezel.net</Alert>}
                    {!loadingSSIDs && !errorSSIDs && (
                        <div className="w-72">
                            <Controller
                                control={control}
                                name={"ssid"}
                                render={({ field: { onChange, value, ref } }) => (
                                    <TextField
                                        fullWidth
                                        select
                                        variant="standard"
                                        inputRef={ref}
                                        value={value}
                                        onChange={onChange}>
                                        {allSSIDs.map((ssid) => <MenuItem value={ssid} key={ssid}>{ssid}</MenuItem>)}
                                    </TextField>
                                )}
                            />
                        </div>
                    )}
                    <div className={!watch("ssid") ? "hidden" : ""}>
                        <div className="mt-8 mb-12" >
                            <Typography variant="h5" color="text.primary" align="left">
                                Informations personelles
                            </Typography>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <FormControl required sx={{ minWidth: 240 }}>
                                <InputLabel id="residence-label">Nom de votre résidence</InputLabel>
                                <Controller
                                    name="residence"
                                    control={control}
                                    render={({ field: { onChange, value } }) => (
                                        <Select
                                            labelId="residence-label"
                                            id="residence"
                                            variant="standard"
                                            value={value}
                                            onChange={onChange}
                                        >
                                            {Object.values(Residence).map((key) => <MenuItem value={key} key={key}>{key}</MenuItem>)}
                                        </Select>
                                    )} />
                            </FormControl>
                            <TextField required id="appartement_id" label="Appartment n°" variant="standard" {...register("appartement_id")} />
                        </div>
                        <div className="mt-16 mb-8">
                            <Typography variant="h5" color="text.primary" align="left">
                                Premier mois d'adhésion : <strong>10€</strong>
                                <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 10€/mois)</Typography>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="left">
                                Le premier mois d'adhésion est à régler dès maintenant.<br />
                                Une fois que nous aurons confirmé la réception du paiement,
                                nous activerons un nouveau réseau Wi-Fi pour toi sur la box que tu as
                                indiquée plus haut. Tu recevras alors un mail de confirmation.
                            </Typography>
                        </div>
                        <div className="flex flex-col gap-4">
                            <FormControl required variant="standard" sx={{ textAlign: "left" }}>
                                <FormLabel id="payment-method-first-month-label">Mode de paiement</FormLabel>
                                <Controller
                                    name="paymentMethodFirstMonth"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field: { onChange, value } }) => (
                                        <RadioGroup
                                            aria-label="paymentMethodFirstMonth"
                                            name="paymentMethodFirstMonth"
                                            value={value}
                                            onChange={onChange}
                                        >
                                            <FormControlLabel value={PaymentMethod.VIREMENT} control={<Radio />} label="Par virement bancaire" />
                                            <FormControlLabel value={PaymentMethod.ESPECE} control={<Radio />} label="En espèces au local de l'assocation" />
                                        </RadioGroup>
                                    )} />
                                <FormHelperText error> {formState.errors.paymentMethodFirstMonth && "Vous devez indiquer un moyen de paiement"}</FormHelperText>
                            </FormControl>
                        </div>
                    </div>
                    <div className="mt-16">
                        {formState.isSubmitting ?
                            <CircularProgress />
                            :
                            <Button variant="contained" type="submit" disabled={!watch("ssid")} >
                                Je souhaite adhérer à Rezel
                            </Button>
                        }
                    </div>
                </div>
            </form >
        </div >
    );
}