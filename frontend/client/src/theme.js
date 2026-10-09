import { createTheme } from "@mui/material/styles";

export const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#90caf9" : "#1976d2" },
      secondary: { main: mode === "dark" ? "#ce93d8" : "#9c27b0" },
      success: { main: mode === "dark" ? "#81c784" : "#2e7d32" },
      warning: { main: mode === "dark" ? "#ffb74d" : "#ed6c02" },
      error: { main: mode === "dark" ? "#f48fb1" : "#d32f2f" },
    },
  });