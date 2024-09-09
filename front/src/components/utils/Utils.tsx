import { Badge, Chip, createTheme } from "@mui/material";
import { MembershipType } from "../../utils/types/types";

export default function MembershipTypeChip({ type, small }: { type: MembershipType, small?: boolean }) {
    if (!type) return null;
    const color = type == MembershipType.WIFI ? "wifiColor" : "ftthColor";
    const text = type == MembershipType.WIFI ? "Wi-fi" : "FTTH";

    const customColors = {
        wifiColor: {
            backgroundColor: "#BCBD8B",
            color: "#000000",
        },
        ftthColor: {
            backgroundColor: "#766153",
            color: "#FFFFFF",
        }
    };

    return (
        <Chip
            label={text}
            sx={customColors[color]}
            size={small ? "small" : "medium"}
            variant="filled"
        />
    )
}