import * as React from 'react';
import { Button, TextField, Typography } from "@mui/material";
import CmdAccesDialog from './CmdAccesDialog';
import CRMESDialog from './CRMiseEnService';
import AnnulAccesDialog from './AnnulAccesDialog';

export default function InteropSection({
    registerToMembershipUpdateForm,
    user
}: {
    registerToMembershipUpdateForm: any,
    user: any
}) {
    const [cmdAccesDialogOpen, setCmdAccesDialogOpen] = React.useState(false);
    const [CRMESDialogOpen, setCRMESDialogOpen] = React.useState(false);
    const [annulAccesOpen, setAnnulAccesDialogOpen] = React.useState(false);

    return (
        <div className="mt-10 max-w-xs">
            <Typography variant="h5" align="left" color="text.primary" component="div">
                Interop
            </Typography>
            <Typography variant="body1" align="left" color="text.secondary" component="div" className="mt-3">
                <div>
                    <div className="mt-5">
                        <strong>Ref interne commande Rezel</strong>
                        <TextField className="bg-white" size="small" fullWidth {...registerToMembershipUpdateForm("ref_commande")} />
                    </div>
                    <div className="mt-5">
                        <strong>Ref prestation Orange</strong>
                        <TextField className="bg-white" size="small" fullWidth {...registerToMembershipUpdateForm("ref_prestation")} />
                    </div>
                    <div className="mt-5">
                        <Button variant="contained" onClick={() => setCmdAccesDialogOpen(true)}>
                            Générer CMD_ACCES
                        </Button>
                    </div>
                    <div className="mt-5">
                        <Button variant="contained" onClick={() => setCRMESDialogOpen(true)}>
                            Générer CR_MES
                        </Button>
                    </div>
                    <div className="mt-5">
                        <Button variant="contained" onClick={() => setAnnulAccesDialogOpen(true)}>
                            Générer ANNUL_ACCES
                        </Button>
                    </div>
                    <div className="flex items-center mt-5">
                        <input type="checkbox" {...registerToMembershipUpdateForm("cmd_acces_sent")} />
                        <strong className="pl-2">CMD_ACCES envoyé</strong>
                    </div>
                    <div className="flex items-center mt-5">
                        <input type="checkbox" {...registerToMembershipUpdateForm("cr_mes_sent")} />
                        <strong className="pl-2">CR_MES envoyé</strong>
                    </div>
                    <div className="flex items-center mt-5">
                        <input type="checkbox" {...registerToMembershipUpdateForm("annul_acces_sent")} />
                        <strong className="pl-2">ANNUL_ACCES envoyé</strong>
                    </div>
                    <CmdAccesDialog
                        open={cmdAccesDialogOpen}
                        onClose={() => setCmdAccesDialogOpen(false)}
                        user={user}
                    />
                    <CRMESDialog
                        open={CRMESDialogOpen}
                        onClose={() => setCRMESDialogOpen(false)}
                        user={user}
                    />
                    <AnnulAccesDialog
                        open={annulAccesOpen}
                        onClose={() => setAnnulAccesDialogOpen(false)}
                        user={user}
                    />
                </div>
            </Typography>
        </div>
    )
}