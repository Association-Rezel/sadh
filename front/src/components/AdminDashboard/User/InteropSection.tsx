import { TextField, Typography } from "@mui/material";
import { SubscriptionFlow } from "../../../utils/types";

export default function InteropSection({ currentSubFlow, registerToSubFlowForm }: { currentSubFlow: SubscriptionFlow, registerToSubFlowForm: any }) {
    return (
        <div>
            <Typography variant="h5" align="left" color="text.primary" component="div" sx={{ marginTop: 10 }}>
                Interop
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" className="mt-3">
                {currentSubFlow === null && <p>Chargement...</p>}
                {currentSubFlow !== null && (
                    <div>
                        <div className="mt-5">
                            <strong>Ref interne commande Rezel</strong>
                            <TextField size="small"fullWidth {...registerToSubFlowForm("ref_commande")} />
                        </div>
                        <div className="mt-5">
                            <strong>Ref prestation Orange</strong>
                            <TextField size="small" fullWidth {...registerToSubFlowForm("ref_prestation")} />
                        </div>
                        <div className="flex items-center mt-5">
                            <input type="checkbox" {...registerToSubFlowForm("cmd_acces_sent")} />
                            <strong className="pl-2">CMD_ACCES envoyé</strong>
                        </div>
                        <div className="flex items-center mt-5">
                            <input type="checkbox" {...registerToSubFlowForm("cr_mes_sent")} />
                            <strong className="pl-2">CR_MES envoyé</strong>
                        </div>
                    </div>
                )}
            </Typography>
        </div>
    )
}