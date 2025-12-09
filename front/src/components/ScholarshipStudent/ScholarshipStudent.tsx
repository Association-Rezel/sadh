import { Button, CircularProgress, Typography, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { Delete, Refresh } from "@mui/icons-material";
import Api from "../../utils/Api";
import { useState } from "react";
import { User } from "../../utils/types/types";
import ConfirmableButton from "../utils/ConfirmableButton";

export default function ScholarshipStudent() {
    const [students, setStudents] = useState<User[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const showAll = () => {
        setLoading(true);
        Api.fetchAllScholarshipStudents()
            .then(setStudents)
            .catch(alert)
            .finally(() => setLoading(false));
    }

    const resetAll = () => {
        setLoading(true);
        Api.resetAllScholarshipStudents()
            .then(() => setStudents([]))
            .catch(alert)
            .finally(() => setLoading(false));
    }

    return (
        <div className="flex flex-col gap-8">
            {loading && <CircularProgress />}
            <div className="flex flex-row gap-4">
                <Button onClick={showAll} color="primary" disabled={loading} variant="contained" startIcon={<Refresh />}>
                    Voir tous les étudiants boursiers
                </Button>
                <ConfirmableButton
                    confirmationText={
                        <p>
                            Êtes-vous sûr de vouloir réinitialiser tous les étudiants boursiers ?
                        </p>}
                    onConfirm={resetAll}
                    buttonColor="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={<Delete />}
                >
                   Réinitialiser tous les étudiants boursiers
                </ConfirmableButton>
            </div>
            {students && students.length > 0 &&
                <div>
                    <Typography variant="h6">
                        Étudiants boursiers
                    </Typography>
                    <List>
                        {students.map(student => (
                            <ListItem key={student.id}>
                                <ListItemText primary={`${student.first_name} ${student.last_name}`} />
                                <IconButton onClick={() => {
                                    Api.updateUser(student.id, { scholarship_student: false }).then(() => {
                                        setStudents(students.filter(s => s.id !== student.id));
                                    }).catch(alert);
                                }}>
                                    <Delete />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                </div>
            }
            {students && students.length === 0 &&
                <Typography variant="body1">
                    Aucun étudiant boursier trouvé.
                </Typography>
            }
        </div>
    );
};
