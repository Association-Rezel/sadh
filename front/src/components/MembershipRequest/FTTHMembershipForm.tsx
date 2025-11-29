import { Button, CircularProgress, FormControl, FormControlLabel, FormHelperText, FormLabel, InputLabel, Link, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material";
import { validateIBAN } from "ngx-iban-validator/dist/iban.validator";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuthContext } from "../../pages/auth/AuthContext";
import Api from "../../utils/Api";
import { MembershipType, PaymentMethod, Residence } from "../../utils/types/types";

type FormValues = {
    residence: string;
    appartement_id: string;
    phone_number: string;
    iban: string;
    paymentMethodFirstMonth: string;
    paymentMethodMembership: string;
    paymentMethodDeposit: string;
};

export default function FTTHMembershipForm() {
    const {
        register,
        handleSubmit,
        control,
        formState,
        reset,
    } = useForm<FormValues>({
        defaultValues: {
            residence: "",
            appartement_id: "",
            phone_number: "",
            iban: "",
            paymentMethodFirstMonth: "",
            paymentMethodMembership: "",
            paymentMethodDeposit: "",
        }
    });

    const { user, setUser } = useAuthContext();

    useEffect(() => {
        reset({
            residence: user?.membership?.address.residence || "",
            appartement_id: user?.membership?.address.appartement_id || "",
            phone_number: user?.phone_number || "",
            iban: user?.iban || "",
        });

    }, [user]);

    const onSubmitMembership = async (event: FormValues) => {
        try {
            const user = await Api.submitMyMembershipRequest({
                type: MembershipType.FTTH,
                address: {
                    residence: Residence[event.residence],
                    appartement_id: event.appartement_id,
                },
                phone_number: event.phone_number,
                iban: event.iban,
                payment_method_first_month: PaymentMethod[event.paymentMethodFirstMonth],
                payment_method_membership: PaymentMethod[event.paymentMethodMembership],
                payment_method_deposit: PaymentMethod[event.paymentMethodDeposit],
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
                S'abonner à Rezel (Fibre)
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
                    <div className="flex flex-col items-start gap-2 mt-4">
                        <label className="block" htmlFor="iban">IBAN *</label>
                        <Controller
                            name="iban"
                            control={control}
                            rules={{
                                validate: (value) => {
                                    const validation = validateIBAN({ value });
                                    if (validation?.ibanInvalid) {
                                        if (validation.error?.countryUnsupported) {
                                            return "Pays non supporté pour l'IBAN";
                                        }
                                        if (validation.error?.codeLengthInvalid) {
                                            return "Longueur de l'IBAN invalide";
                                        }
                                        if (validation.error?.patternInvalid) {
                                            return "Format de l'IBAN invalide";
                                        }
                                    }
                                    return true; // IBAN valide
                                }
                            }}
                            render={({ field: { onChange, value }, fieldState: { error } }) => (
                                <>
                                    <TextField
                                        id="iban"
                                        variant="standard"
                                        placeholder="Entrez votre IBAN"
                                        required
                                        value={value}
                                        onChange={(e) => onChange(e.target.value.replace(/\s+/g, ""))}
                                        error={!!error}
                                        helperText={error ? error.message : ""}
                                        inputProps={{
                                            style: { width: "30ch" }
                                        }}
                                    />
                                </>
                            )}
                        />
                        <Typography variant="body2" color="text.secondary" align="left">
                            Cet IBAN nous servira à effectuer des remboursements partiels en cas de partage de votre lien fibre <br />
                            (voir contrat et réglement intérieur à l'étape suivante), et pour rembourser votre caution à la fin de votre abonnement.
                        </Typography>
                    </div>
                    <div className="mt-16 mb-8">
                        <Typography variant="h5" color="text.primary" align="left">
                            Premier mois d'abonnement : <strong>20€</strong>
                            <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 20€/mois)</Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Le premier mois d'abonnement est à régler dès maintenant.<br />
                            Votre abonnement ne commencera qu'à partir de la date de votre rendez-vous d'installation.
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

                    <div className="mt-16 mb-8">
                        <Typography variant="h5" color="text.primary" align="left">
                            Première année d'adhésion : <strong>1€</strong>
                            <Typography className="inline" variant="body1" color="text.secondary" align="left"> (puis 1€/an)</Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="left">
                            Vous devez régler votre cotisation pour un an. Être membre adhérent de Rezel est obligatoire pour bénéficier du service FAI.<br />
                            Votre adhésion commencera le jour de la signature de votre contrat. <br />
                            Elle est à renouveler chaque année à la date anniversaire de votre adhésion.
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
                                        <FormControlLabel value={PaymentMethod.ESPECE} control={<Radio />} label="En espèces au local de l'association" />
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
                                Je souhaite m'abonner à Rezel
                            </Button>
                        }
                    </div>
                </div>
            </form>
        </div>
    );
}
