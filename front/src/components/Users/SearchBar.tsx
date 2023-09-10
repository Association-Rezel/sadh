import { useState } from "react";
import "./SearchBar.css";
import { Button, TextField } from "@mui/material";
import { Filter } from "./Filter";

interface SearchBarProps {
    onSearch: (search: string) => void;
    changeResidence: (residence: string) => void;
    placeholder?: string;
}

export function SearchBar({ onSearch, changeResidence, placeholder }: SearchBarProps) {
    const [search, setSearch] = useState<string>("");
    const [filterShown, setFilterShown] = useState<boolean>(false);

    return (
        <div>
            <div className="searchbar-div">
                <TextField
                    className="searchbar-user"
                    placeholder={placeholder ?? "Search..."}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        onSearch(e.target.value);
                    }}
                />
                <Button
                    variant="outlined"
                    onClick={() => {
                        setFilterShown(!filterShown);
                        changeResidence("");
                    }}
                    style={{ marginLeft: "10px" }}
                >
                    Filtrer
                </Button>
            </div>
            <div>{filterShown && <Filter changeResidence={changeResidence} />}</div>
        </div>
    );
}
