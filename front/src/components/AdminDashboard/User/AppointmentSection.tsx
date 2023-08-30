import { SubscriptionFlow } from "../../../utils/types";
import { TextField, TextareaAutosize, Typography } from "@mui/material";

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
                        <TextareaAutosize className="block mb-5" minRows={3} {...registerToSubFlowForm("erdv_information")} />
                        <div>
                            <strong>ID E-RDV</strong> : <input type="text" {...registerToSubFlowForm("erdv_id")} />
                        </div>
                        <div>
                            <strong>Personne présente au rdv</strong> : <input type="text" {...registerToSubFlowForm("present_for_appointment")} />
                        </div>
                    </>
                )}
            </Typography>
        </div>
    )
}