import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";

interface FilterProps {
    changeResidence: (residence: string) => void;
}

export function Filter({ changeResidence }: FilterProps) {
    const [residence, setResidence] = useState<string>("");

    return (
        <div style={{ width: "200px", marginLeft: "20px", marginBottom: "30px" }}>
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Résidence</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={residence}
                    label="residence"
                    onChange={(e) => {
                        setResidence(e.target.value);
                        changeResidence(e.target.value);
                    }}
                >
                    <MenuItem value={""}>Déselection</MenuItem>
                    <MenuItem value={"ALJT"}>ALJT</MenuItem>
                    <MenuItem value={"Kley"}>Kley</MenuItem>
                    <MenuItem value={"Twenty Campus"}>Twenty Campus</MenuItem>
                </Select>
            </FormControl>
        </div>
    );
}
