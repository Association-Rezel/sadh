import { Alert, Button, CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import 'react-phone-number-input/style.css';
import { useAuthContext } from "../../pages/auth/AuthContext";
import Api from "../../utils/Api";
import { MembershipType, PaymentMethod, Residence } from "../../utils/types/types";

type FormValues = {
    residence: string;
    appartement_id: string;
    ssid: string;
    paymentMethodFirstMonth: string;
    paymentMethodMembership: string;
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
        getValues,
    } = useForm<FormValues>({
        defaultValues: {
            ssid: "",
            residence: "",
            appartement_id: "",
            paymentMethodFirstMonth: "",
            paymentMethodMembership: "",
            paymentMethodDeposit: "",
        }
    });

    const { user, setUser } = useAuthContext();
    const [allSSIDs, setAllSSIDs] = useState<string[]>([]);
    const [errorSSIDs, setErrorSSIDs] = useState<boolean>(false);
    const [loadingSSIDs, setLoadingSSIDs] = useState<boolean>(false);

    useEffect(() => {
        reset({
            residence: user?.membership?.address.residence || "",
            appartement_id: user?.membership?.address.appartement_id || "",
        });

    }, [user]);

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
            const realSSID = allSSIDs.find((ssid) => ssid.toLowerCase() === "rezel-" + event.ssid.toLowerCase());
            if (!realSSID) {
                alert("Erreur lors de la demande d'abonnement. Le réseau Wi-Fi n'existe pas.");
                return;
            }

            const user = await Api.submitMyMembershipRequest({
                type: MembershipType.WIFI,
                ssid: realSSID,
                address: {
                    residence: Residence[event.residence],
                    appartement_id: event.appartement_id,
                },
                payment_method_first_month: PaymentMethod[event.paymentMethodFirstMonth],
                payment_method_membership: PaymentMethod[event.paymentMethodMembership],
            });
            setUser({ ...user });
        } catch (error) {
            alert(
                "Erreur lors de la demande d'abonnement. Veuillez réessayer ultérieurement. Message d'erreur : " +
                error.message +
                "\nSi le problème persiste, veuillez contacter contact@rezel.net"
            );
        }
    };

    return (
        <div>
            <Typography component="h1" variant="h2" align="center" color="text.primary" gutterBottom>
                S'abonner à Rezel (Wi-Fi)
            </Typography>
            <form className="container mt-16 max-w-2xl" onSubmit={handleSubmit(onSubmitMembership)}>
                <div className="flex flex-col items-start">
                    <div className="mt-8 mb-12" >
                        <Typography variant="h5" color="text.primary" align="left">
                            Wi-Fi Rezel le plus proche
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Merci d'indiquer le réseau Wi-Fi Rezel-xxx que tu reçois le mieux de chez toi.<br />
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
                        <div className="flex flex-row gap-4 items-center">
                            <span>Rezel-</span>
                            <div className="w-72">
                                <Controller
                                    control={control}
                                    name={"ssid"}
                                    rules={{ required: true, validate: (value) => allSSIDs.find((ssid: string) => ssid.toLowerCase() === "rezel-" + value.toLowerCase()) != null }}
                                    render={({ field: { onChange, value, ref } }) => (
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            inputRef={ref}
                                            value={value}
                                            onChange={onChange}>
                                        </TextField>
                                    )}
                                />
                            </div>
                        </div>

                    )}
                    {formState.errors.ssid &&
                        <Typography variant="body2" color="error" align="left">
                            Ce réseau Wi-Fi n'existe pas.
                        </Typography>
                    }
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
                            Premier mois d'abonnement : <strong>10€</strong>
                            <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 10€/mois)</Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Le premier mois d'abonnement est à régler dès maintenant.<br />
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
                                        <FormControlLabel value={PaymentMethod.ESPECE} control={<Radio />} label="En espèces au local de l'association" />
                                    </RadioGroup>
                                )} />
                            <FormHelperText error> {formState.errors.paymentMethodFirstMonth && "Vous devez indiquer un moyen de paiement"}</FormHelperText>
                        </FormControl>
                    </div>
                </div>
                <div className="mt-16 mb-8">
                    <Typography variant="h5" color="text.primary" align="left">
                        Première année d'adhésion : <strong>1€</strong>
                        <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 1€/an)</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="left">
                        Vous devez régler votre cotisation pour un an. Être membre adhérent de Rezel est obligatoire pour bénéficier du service FAI.<br />
                        Votre adhésion commencera le jour de la signature de votre contrat. <br />
                        Elle est à rendertue chaque année à la date anniversaire de votre adhésion.
                    </Typography>
                </div>
                <div className="flex flex-col gap-4">
                    <FormControl required variant="standard" sx={{ textAlign: "left" }}>
                        <FormLabel id="payment-method-first-month-label">Mode de paiement</FormLabel>
                        <Controller
                            name="paymentMethodMembership"
                            control={control}
                            rules={{ required: true }}
                            render={({ field: { onChange, value } }) => (
                                <RadioGroup
                                    aria-label="paymentMethodMembership"
                                    name="paymentMethodMembership"
                                    value={value}
                                    onChange={onChange}
                                >
                                    <FormControlLabel value={PaymentMethod.VIREMENT} control={<Radio />} label="Par virement bancaire" />
                                    <FormControlLabel value={PaymentMethod.ESPECE} control={<Radio />} label="En espèces au local de l'association" />
									<FormControlLabel value={PaymentMethod.HELLOASSO} control={<Radio />} label="Par carte bancaire (via HelloAsso)" />
                                </RadioGroup>
                            )} />
                        <FormHelperText error> {formState.errors.paymentMethodMembership && "Vous devez indiquer un moyen de paiement"}</FormHelperText>
                    </FormControl>
                </div>
                <div className="mt-16">
                    {formState.isSubmitting ?
                        <CircularProgress />
                        :
                        <Button variant="contained" type="submit" disabled={!watch("ssid")} >
                            Je souhaite m'abonner à Rezel
                        </Button>
                    }
                </div>
            </form >
        </div >
    );
}
