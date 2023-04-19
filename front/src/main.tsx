import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { mdTheme } from "./utils/constants";
import { ThemeProvider } from "@mui/material/styles";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider theme={mdTheme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);
