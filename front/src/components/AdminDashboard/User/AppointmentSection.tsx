import { SubscriptionFlow } from "../../../utils/types";
import { TextField, Typography } from "@mui/material";
import { Textarea } from "@mui/joy";

export default function AppointmentSection({ currentSubFlow, registerToSubFlowForm }: { currentSubFlow: SubscriptionFlow, registerToSubFlowForm: any }) {
    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Rendez-vous
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {currentSubFlow === null && <p>Chargement...</p>}
                {currentSubFlow !== null && (
                    <>
                        <strong>Informations</strong>
                        <Textarea minRows={3} {...registerToSubFlowForm("erdv_information")} />
                        <div className="mt-5">
                            <strong>ID E-RDV</strong>
                            <TextField size="small" fullWidth {...registerToSubFlowForm("erdv_id")} />
                        </div>
                        <div className="mt-5">
                            <strong>Personne présente au rdv</strong>
                            <TextField size="small" fullWidth {...registerToSubFlowForm("present_for_appointment")} />
                        </div>
                    </>
                )}
            </Typography>
        </div>
    )
}