import { Button, FormControlLabel, Typography, Checkbox, FormControl, InputLabel, Select, MenuItem, TextField, Radio, RadioGroup, FormLabel, FormHelperText, CircularProgress } from "@mui/material";
import { MembershipType, PaymentMethod, Residence, User } from "../../utils/types/types";
import { Api } from "../../utils/Api";
import { Controller, useForm, useFormState } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useContext, useEffect } from "react";
import { AppStateContext } from "../../utils/AppStateContext";

type FormValues = {
    residence: string;
    appartement_id: string;
    phone_number: string;
    paymentMethodFirstMonth: string;
    paymentMethodDeposit: string;
};

export default function FTTHMembershipForm() {
    const {
        register,
        handleSubmit,
        control,
        formState,
        watch,
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            residence: "",
            appartement_id: "",
            phone_number: "",
            paymentMethodFirstMonth: "",
            paymentMethodDeposit: "",
        }
    });

    const { appState, updateAppState } = useContext(AppStateContext);

    useEffect(() => {
        reset({
            residence: appState.user?.membership?.address.residence,
            appartement_id: appState.user?.membership?.address.appartement_id,
            phone_number: appState.user?.phone_number,
        });

    }, [appState.user]);

    const onSubmitMembership = async (event: FormValues) => {
        try {
            const user = await Api.submitMyMembershipRequest({
                type: MembershipType.FTTH,
                address: {
                    residence: Residence[event.residence],
                    appartement_id: event.appartement_id,
                },
                phone_number: event.phone_number,
                payment_method_first_month: PaymentMethod[event.paymentMethodFirstMonth],
                payment_method_deposit: PaymentMethod[event.paymentMethodDeposit],
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
                Adhérer à Rezel (Fibre)
            </Typography>
            <form className="container mt-16" onSubmit={handleSubmit(onSubmitMembership)}>
                <div className="flex flex-col items-start">
                    <div className="mt-8 mb-12" >
                        <Typography variant="h5" color="text.primary">
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
                        <div className="flex flex-col items-start gap-2">
                            <label className="block" htmlFor="phone_number">Numéro de téléphone *</label>
                            <Controller
                                name="phone_number"
                                control={control}
                                rules={{
                                    validate: (value) => isValidPhoneNumber(value),
                                    required: true
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <PhoneInput
                                        countries={['FR']}
                                        addInternationalOption={false}
                                        required
                                        onChange={onChange}
                                        value={value}
                                        defaultCountry="FR"
                                        placeholder="+33"
                                        id="phone-input" />
                                )}
                            />
                        </div>
                    </div>
                    <div className="mt-16 mb-8">
                        <Typography variant="h5" color="text.primary" align="left">
                            Premier mois d'adhésion : <strong>20€</strong>
                            <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 20€/mois)</Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Le premier mois d'adhésion est à régler dès maintenant.<br />
                            Votre adhésion ne commencera qu'à partir de la date de votre rendez-vous d'installation.
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

                    <div className="mt-10 mb-8">
                        <Typography variant="h5" color="text.primary" align="left">
                            Caution : <strong>50€</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            La caution vous sera restituée à la fin de votre adhésion en échange des équipements fournis.
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-4">
                        <FormControl required variant="standard" sx={{ textAlign: "left" }}>
                            <FormLabel id="payment-method-deposit-label"> Mode de paiement</FormLabel>
                            <Controller
                                name="paymentMethodDeposit"
                                control={control}
                                rules={{ required: true }}
                                render={({ field: { onChange, value } }) => (
                                    <RadioGroup
                                        aria-label="paymentMethodDeposit"
                                        name="paymentMethodDeposit"
                                        value={value}
                                        onChange={onChange}
                                        >
                                        <FormControlLabel value={PaymentMethod.VIREMENT} control={<Radio />} label="Par virement bancaire" />
                                        <FormControlLabel value={PaymentMethod.CHEQUE} control={<Radio />} label="Par chèque au local de l'association" />
                                        <FormControlLabel value={PaymentMethod.ESPECE} control={<Radio />} label="En espèces au local de l'assocation" />
                                    </RadioGroup>
                                )} />
                            <FormHelperText error> {formState.errors.paymentMethodDeposit && "Vous devez indiquer un moyen de paiement"}</FormHelperText>
                        </FormControl>
                    </div>

                    <div className="mt-16">
                        {formState.isSubmitting ?
                            <CircularProgress />
                            :
                            <Button variant="contained" type="submit">
                                Je souhaite adhérer à Rezel
                            </Button>
                        }
                    </div>
                </div>
            </form>
        </div>
    );
}