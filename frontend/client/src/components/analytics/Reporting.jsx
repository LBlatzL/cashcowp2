
import { useState } from "react";
import apiClient from "../../api/client";
import {
    Alert, Box, Button, Stack,
    TextField, Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Reporting() {
    const { user } = useAuth();
    const canView = ["operations_admin", "auditor"].includes(user?.role);

    const [supervisorId, setSupervisorId] = useState("");
    const [reporting, setReporting] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function fetchReporting() {
        if (!supervisorId) return;

        setLoading(true);
        setError("");

        try {
            const response = await apiClient.get(
                "/technician/reporting-lines",
                {
                    params: {
                        supervisor_id: Number(supervisorId)
                    }
                }
            );

            setReporting([response.data]);
        } catch (err) {
            setReporting([]);
            setError(
                err.response?.status === 404
                    ? "No reporting data found for this supervisor."
                    : "Failed to load reporting lines."
            );
        } finally {
            setLoading(false);
        }
    }

    if (!canView) return null;

    const columns = [
        {
            field: "supervisor_id",
            headerName: "Supervisor ID",
            flex: 1,
            minWidth: 150
        },
        {
            field: "active_technicians",
            headerName: "Active Technicians",
            flex: 1,
            minWidth: 180
        }
    ];

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "left" }}>
                Reporting Lines
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                    label="Supervisor ID"
                    type="number"
                    size="small"
                    value={supervisorId}
                    onChange={(e) => setSupervisorId(e.target.value)}
                    sx={{ width: 180 }}
                />

                <Button
                    variant="contained"
                    color="success"
                    onClick={fetchReporting}
                    disabled={!supervisorId || loading}
                >
                    Search
                </Button>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <DataGrid
                rows={reporting}
                columns={columns}
                getRowId={(row) => row.supervisor_id}
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
                    minHeight: 200,
                    borderRadius: 2,
                    fontSize: 13
                }}
            />
        </Box>
    );
}
