
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { Alert, Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ColocationDisc() {
    const { user } = useAuth();
    const canView = ["operations_admin", "auditor"].includes(user?.role);

    const [discrepancies, setDiscrepancies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!canView) return;

        async function fetchDiscrepancies() {
            setLoading(true);

            try {
                const response = await apiClient.get("/service/colocation");

                setDiscrepancies(response.data);
                setError("");
            } catch {
                setError("Failed to load co-location discrepancies.");
            } finally {
                setLoading(false);
            }
        }

        fetchDiscrepancies();
    }, [canView]);

    if (!canView) return null;

    const columns = [
        { field: "atm_id", headerName: "ATM ID", width: 100 },
        { field: "atm_model", headerName: "ATM Model", flex: 1, minWidth: 150 },
        { field: "atm_branch_id", headerName: "ATM Branch ID", flex: 1, minWidth: 150 },
        { field: "technician_id", headerName: "Technician ID", flex: 1, minWidth: 150 },
        {
            field: "technician_branch_id",
            headerName: "Technician Branch ID",
            flex: 1,
            minWidth: 180
        }
    ];

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "left" }}>
                Co-Location Discrepancies
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DataGrid
                rows={discrepancies}
                columns={columns}
                getRowId={(row) => `${row.atm_id}-${row.technician_id}`}
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
