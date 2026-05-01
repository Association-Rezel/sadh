import {
  useEffect,
  useState,
  useRef,
  useCallback,
  MutableRefObject,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import Api from "../../utils/Api";
import { useAuthContext } from "../auth/AuthContext";
import { MembershipType } from "../../utils/types/types";

interface Invoice {
  id: string;
  ref: string;
  date: number;
  date_lim_reglement: number;
  total_ttc: string;
  remaintopay: string;
  statut: string;
  lines?: InvoiceLine[];
}

interface InvoiceLine {
  description: string;
  total_ttc: string;
}

function formatDate(timestamp: number | string | undefined): string {
  if (!timestamp) return "-";
  const ts = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
  if (isNaN(ts) || ts === 0) return "-";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(amount: string | number | undefined): string {
  if (amount === undefined || amount === null) return "-";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";
  return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function invoiceStatusLabel(statut: string): {
  label: string;
  color: "success" | "warning" | "error" | "default";
} {
  switch (statut) {
    case "0":
      return { label: "Brouillon", color: "default" };
    case "1":
      return { label: "Impayée", color: "warning" };
    case "2":
      return { label: "Payée", color: "success" };
    case "3":
      return { label: "Abandonnée", color: "error" };
    default:
      return { label: "Inconnu", color: "default" };
  }
}

const MONTHLY_PRICES: Record<string, number> = {
  [MembershipType.WIFI]: 10,
  [MembershipType.FTTH]: 20,
};

const MONTHLY_PRICES_SCHOLARSHIP: Record<string, number> = {
  [MembershipType.WIFI]: 5,
  [MembershipType.FTTH]: 15,
};

function monthlyPrice(
  type: string | undefined,
  scholarship: boolean | undefined,
): number {
  if (!type) return 0;
  const table = scholarship ? MONTHLY_PRICES_SCHOLARSHIP : MONTHLY_PRICES;
  return table[type] ?? 0;
}

function AccountStatusAlert({
  label,
  endTs,
  expired,
  expiredMessage,
  validMessage,
  fallbackMessage,
}: {
  label: string;
  endTs: number | null;
  expired: boolean;
  expiredMessage: string;
  validMessage: string;
  fallbackMessage: string;
}) {
  const severity = expired ? "error" : endTs ? "success" : "info";
  const message = endTs
    ? expired
      ? expiredMessage
      : validMessage
    : fallbackMessage;
  if (expired) {
    return (
      <Alert
        severity="error"
        variant="filled"
        sx={{
          fontSize: "1.1rem",
          fontWeight: 600,
          py: 1.5,
          border: "2px solid #b71c1c",
        }}
      >
        <strong> {label} :</strong> {message}
      </Alert>
    );
  }
  return (
    <Alert severity={severity}>
      <strong>{label} :</strong> {message}
    </Alert>
  );
}

export default function PagePayments() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Mes paiements
      </Typography>
      <Typography variant="body1">
        Les paiements en ligne seront disponibles prochainement.
        <br />
        En attendant, aucune démarche n'est nécessaire
        <br />
        Votre accès à internet reste opérationnel pour l'instant et nous
        revenons bientôt vers vous avec plus d'informations.
      </Typography>
    </Box>
  );
}
