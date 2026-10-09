import { Box, Typography } from "@mui/material";

import AppHeader from "./components/layout/AppHeader.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import AtmDataGrid from "./components/analytics/AtmDataGrid.jsx";
import ServiceCallDataGrid from "./components/analytics/ServiceCallDataGrid.jsx";
import ColocationDisc from "./components/analytics/ColocationDisc.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Realiability from "./components/analytics/Realiability.jsx";
import Maintenance from "./components/analytics/Maintenance.jsx";
import Reporting from "./components/analytics/Reporting.jsx";


function App() {
    const { user, logout } = useAuth();

    if (!user) {
        return <LoginForm />;
    }

    return (
        <Box sx={{ minHeight: "100vh", width: "100%" }}>
            <AppHeader
                username={user.sub}
                role={user.role}
                onLogout={logout}
            />

            <Box
                component="main"
                sx={{
                    width: "100%",
                    maxWidth: "1600px",
                    mx: "auto",
                    p: 3,
                    boxSizing: "border-box"
                }}
            >
                <Typography
                    variant="h5"
                    fontWeight={600}
                    sx={{ mb: 3, textAlign: "left" }}
                >
                    CashCow Dashboard
                </Typography>

                <AtmDataGrid />

                <Box sx={{ mt: 4 }}>
                    <ServiceCallDataGrid />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <ColocationDisc />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Realiability />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Maintenance />
                </Box>

                <Box sx={{ mt: 4 }}>
                    <Reporting />
                </Box>

            </Box>
        </Box>
    );
}

export default App;
