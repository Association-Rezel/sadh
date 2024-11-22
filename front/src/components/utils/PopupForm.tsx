import { useState, useRef } from "react";
import { FormControl, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Form } from "react-router-dom";

interface PopupFormProps {
    children: React.ReactNode;
    buttonText: string;
    onSubmit: (formData: FormData) => boolean;
    Title?: string;
    buttonColor?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
    buttonSize?: "small" | "medium" | "large";
    variant?: "contained" | "outlined" | "text";
    startIcon?: React.ReactNode;
    disabled?: boolean;
}

export default function PopupForm({
    children,
    buttonText,
    onSubmit,
    Title = "",
    buttonColor = "primary",
    buttonSize = "small",
    variant = "contained",
    startIcon = null,
    disabled = false,
}: PopupFormProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSubmit = (e: React.FormEvent = null) => {
        if (e) {
            e.preventDefault();
        }

        const formData = new FormData(formRef.current);

        if (onSubmit(formData)) {
            handleCloseDialog();
        }
    }

    return (
        <>
            <Button
                size={buttonSize}
                variant={variant}
                color={buttonColor}
                startIcon={startIcon}
                onClick={handleOpenDialog}
                disabled={disabled}
            >
                {buttonText}
            </Button>
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
                <FormControl component="form" ref={formRef} onSubmit={handleSubmit}>
                    <DialogTitle>{Title}</DialogTitle>
                    <DialogContent>
                        {children}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" autoFocus>
                            Confirmer
                        </Button>
                    </DialogActions>
                </FormControl>
            </Dialog>
        </>
    );
}