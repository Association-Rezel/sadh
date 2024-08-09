import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useState } from "react";
import { Residence } from "../../utils/types/types";

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
                    <MenuItem value={""}>Désélection</MenuItem>
                    {Object.values(Residence).filter(item => !isNaN(Number(item))).map((key) => <MenuItem value={key} key={key}>{Residence[key]}</MenuItem>)}
                </Select>
            </FormControl>
        </div>
    );
}
