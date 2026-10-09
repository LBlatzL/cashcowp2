
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { Alert, Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Realiability() {
    const { user } = useAuth();
    const canView = ["operations_admin", "auditor"].includes(user?.role);

    const [reliability, setReliability] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!canView) return;

        async function fetchReliability() {
            setLoading(true);

            try {
                const response = await apiClient.get("/service/reliability");

                setReliability(response.data);
                setError("");
            } catch {
                setError("Failed to load reliability metrics.");
            } finally {
                setLoading(false);
            }
        }

        fetchReliability();
    }, [canView]);

    if (!canView) return null;

    const columns = [
        { field: "atm_model", headerName: "ATM Model", flex: 1, minWidth: 160 },
        { field: "completed", headerName: "Completed", flex: 1, minWidth: 140 },
        { field: "failed", headerName: "Failed", flex: 1, minWidth: 140 }
    ];

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "left" }}>
                Reliability Metrics
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DataGrid
                rows={reliability}
                columns={columns}
                getRowId={(row) => row.atm_model}
                loading={loading}
                rowHeight={44}
                columnHeaderHeight={44}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 5, page: 0 }
                    }
                }}
                disableRowSelectionOnClick
                sx={{
                    width: "100%",
                    minHeight: 280,
                    borderRadius: 2,
                    fontSize: 13
                }}
            />
        </Box>
    );
}
