import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Icon } from "@mui/material";

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
  type?: "button" | "iconbutton";
}

export default function ConfirmableButton({
  children,
  confirmationText,
  onConfirm,
  buttonColor,
  dialogTitle = "⚠️ Attention",
  buttonSize = "small",
  variant = "contained",
  startIcon = null,
  disabled = false,
  type = "button"
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
      {type === "iconbutton" ?
        <IconButton
          size={buttonSize}
          color={buttonColor}
          onClick={handleOpenDialog}
          disabled={disabled}
        >
          {children}
        </IconButton>
        :
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
      }

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