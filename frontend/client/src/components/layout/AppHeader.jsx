import {
    AppBar, Toolbar, Typography, Box,
    Button, IconButton, Tooltip
} from "@mui/material";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useAppTheme } from "../../context/ThemeContext";

function AppHeader({ username, role, onLogout }) {
    const { mode, toggleTheme } = useAppTheme();

    return (
        <AppBar position="static" color="success">
            <Toolbar>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexGrow: 1
                    }}
                >
                    <AccountBalanceIcon sx={{ mr: 1 }} />

                    <Typography variant="h6" component="h1">
                        CashCow Command Center
                    </Typography>
                </Box>

                <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
                    <IconButton
                        color="inherit"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
                    >
                        {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                    </IconButton>
                </Tooltip>

                {username && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            ml: 2
                        }}
                    >
                        <Typography variant="body2">
                            {username} ({role})
                        </Typography>

                        <Button color="inherit" onClick={onLogout}>
                            Log Out
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}

export default AppHeader;
