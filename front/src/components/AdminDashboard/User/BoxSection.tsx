import { SubscriptionFlow } from "../../../utils/types";
import { TextField, Typography } from "@mui/material";

export default function BoxSection({ currentSubFlow, registerToSubFlowForm }: { currentSubFlow: SubscriptionFlow, registerToSubFlowForm: any }) {
    return (
        <div className="mt-10">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Box
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" sx={{ marginTop: 3 }}>
                {currentSubFlow === null && <p>Chargement...</p>}
                {currentSubFlow !== null && (
                    <>
                        <strong>Informations</strong>
                        <div className="my-3">
                            <TextField multiline variant="outlined" className="bg-white w-80" minRows={3} {...registerToSubFlowForm("box_information")} />
                        </div>
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