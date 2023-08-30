import { SubscriptionFlow } from "../../../utils/types";
import { TextareaAutosize, Typography } from "@mui/material";

export default function BoxSection({ currentSubFlow, registerToSubFlowForm }: { currentSubFlow: SubscriptionFlow, registerToSubFlowForm: any }) {
    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Box
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {currentSubFlow === null && <p>Chargement...</p>}
                {currentSubFlow !== null && (
                    <>
                        <strong>Informations</strong>
                        <TextareaAutosize className="block mb-5" minRows={3} {...registerToSubFlowForm("box_information")} />
                        <div className="flex items-center">
                            <input type="checkbox" {...registerToSubFlowForm("box_lent")} />
                            <strong className="pl-2">Box confiée à l'adhérent</strong>
                        </div>

                    </>
                )}
            </Typography>
        </div>
    )
}