
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { Alert, Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Maintenance() {
    const { user } = useAuth();
    const canView = ["operations_admin", "auditor"].includes(user?.role);

    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!canView) return;

        async function fetchMaintenance() {
            setLoading(true);

            try {
                const response = await apiClient.get("/atm/maintenance-flags");

                setBranches(response.data);
                setError("");
            } catch {
                setError("Failed to load maintenance flags.");
            } finally {
                setLoading(false);
            }
        }

        fetchMaintenance();
    }, [canView]);

    if (!canView) return null;

    const columns = [
        { field: "branch_id", headerName: "Branch ID", width: 110 },
        { field: "branch_name", headerName: "Branch Name", flex: 1, minWidth: 180 },
        { field: "total_atms", headerName: "Total ATMs", flex: 1, minWidth: 120 },
        {
            field: "maintenance_atms",
            headerName: "ATMs in Maintenance",
            flex: 1,
            minWidth: 180
        },
        {
            field: "maintenance_percentage",
            headerName: "Maintenance (%)",
            flex: 1,
            minWidth: 160,
            valueFormatter: (value) => `${Number(value).toFixed(1)}%`
        }
    ];

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "left" }}>
                Maintenance Flags
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DataGrid
                rows={branches}
                columns={columns}
                getRowId={(row) => row.branch_id}
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
