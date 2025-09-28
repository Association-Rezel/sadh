import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Typography,
    TextField,
    Button,
    CircularProgress,
    Autocomplete,
    Box,
} from "@mui/material";
import { Download } from "@mui/icons-material";
import Api from "../../../utils/Api";

type FormValues = {
    macAddress: string;
    ptahProfile: string | null;
};


export default function PtahImageDownloader() {
    const [ptahProfiles, setPtahProfiles] = useState<string[]>([]);
    const [ptahProfilesLoading, setPtahProfilesLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const { handleSubmit, control, formState: { errors } } = useForm<FormValues>({
        defaultValues: {
            macAddress: "",
            ptahProfile: null,
        },
    });

    useEffect(() => {
        setPtahProfilesLoading(true);
        Api.getPtahProfilesNameList()
            .then(profiles => {
                setPtahProfiles(profiles);
            })
            .catch(e => {
                alert("Erreur lors de la récupération des profils Ptah : " + e);
            })
            .finally(() => {
                setPtahProfilesLoading(false);
            });
    }, []);


    const onSubmit = async (data: FormValues) => {
        // Ensure a profile is selected before proceeding.
        if (!data.ptahProfile) {
            alert("Veuillez sélectionner un profil Ptah.");
            return;
        }

        setIsDownloading(true);
        try {
            await Api.downloadPtahImage(data.macAddress, data.ptahProfile);
        } catch (e) {
            alert("Erreur lors du téléchargement de l'image : " + e);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Box className="flex flex-col gap-8 p-4 md:p-8">
            <Box className="col-span-3 flex flex-col mt-8 md:mt-16">
                <Box className="mb-12 text-center">
                    <Typography
                        variant="h2"
                        color={"text.primary"}
                    >
                        Téléchargement image Ptah
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        className="mt-2"
                        align="center"
                    >
                        Cette page permet de générer et télécharger une image firmware Ptah pour une adresse MAC et un profil donnés, sans nécessiter qu'une box soit assignée.
                    </Typography>
                </Box>
            </Box>

            <Box
                component="form"
                className="flex flex-col gap-6 items-center w-full max-w-sm mx-auto"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                <Controller
                    name="macAddress"
                    control={control}
                    rules={{
                        required: "L'adresse MAC est requise.",
                        pattern: {
                            value: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
                            message: "Format d'adresse MAC invalide."
                        }
                    }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Adresse MAC"
                            variant="outlined"
                            required
                            fullWidth
                            error={!!errors.macAddress}
                            helperText={errors.macAddress?.message}
                        />
                    )}
                />
                <Controller
                    name="ptahProfile"
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <Autocomplete
                            options={ptahProfiles}
                            loading={ptahProfilesLoading}
                            value={value}
                            onChange={(event, newValue) => onChange(newValue)}
                            fullWidth
                            getOptionDisabled={(option) => option === value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Profil Ptah"
                                    required
                                    variant="outlined"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {ptahProfilesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    )}
                />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isDownloading || ptahProfilesLoading}
                    startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
                    sx={{ height: 56 }}
                    fullWidth
                >
                    {isDownloading ? "Génération en cours..." : "Télécharger l'image"}
                </Button>
            </Box>
        </Box>
    );
}

