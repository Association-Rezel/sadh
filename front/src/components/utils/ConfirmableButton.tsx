import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";

interface ConfirmableButtonProps {
  children: React.ReactNode;
  confirmationText?: string | React.ReactNode;
  onConfirm: () => void;
  dialogTitle?: string;
  buttonColor?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  buttonSize?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "text";
  startIcon?: React.ReactNode;
  disabled?: boolean;
}

export default function ConfirmableButton({
  children,
  confirmationText,
  onConfirm,
  dialogTitle = "⚠️ Attention",
  buttonColor = "error",
  buttonSize = "small",
  variant = "contained",
  startIcon = null,
  disabled = false,
}: ConfirmableButtonProps) {
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

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
        {children}
      </Button>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmationText}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={() => { onConfirm(); handleCloseDialog() }}>
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}