import { createContext, useContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline, useMediaQuery } from "@mui/material";
import { getTheme } from "../theme";

const ThemeContext = createContext();

export const useAppTheme = () => useContext(ThemeContext);

export function AppThemeProvider({ children }) {
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");

  const [choice, setChoice] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      return ["light", "dark"].includes(saved) ? saved : null;
    } catch {
      return null;
    }
  });

  const mode = choice ?? (systemDark ? "dark" : "light");
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setChoice(next);

    try {
      localStorage.setItem("theme", next);
    } catch {
      // Continue working if storage is blocked
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}