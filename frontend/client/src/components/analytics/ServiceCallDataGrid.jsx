
import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import {
    Alert, Box, Button, Dialog, DialogActions,
    DialogContent, DialogTitle, MenuItem,
    Stack, TextField, Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";

const priorities = ["low", "medium", "critical"];
const statuses = ["pending", "in_progress", "completed", "failed"];

const emptyServiceCall = {
    title: "",
    priority: "low",
    status: "pending",
    atm_id: "",
    technician_id: ""
};

function formatCall(call) {
    return {
        ...call,
        atm_id: Number(call.atm_id),
        technician_id: Number(call.technician_id)
    };
}

function ServiceCallFields({ call, setter }) {
    function handleChange(e) {
        const { name, value } = e.target;
        setter(current => ({ ...current, [name]: value }));
    }

    return (
        <Stack spacing={2} sx={{ mt: 1 }}>
            {Object.keys(emptyServiceCall).map(field => (
                <TextField
                    key={field}
                    select={field === "priority" || field === "status"}
                    label={field.replaceAll("_", " ").toUpperCase()}
                    name={field}
                    type={["atm_id", "technician_id"].includes(field) ? "number" : "text"}
                    value={call[field] ?? ""}
                    onChange={handleChange}
                    size="small"
                    required
                    fullWidth
                >
                    {field === "priority" &&
                        priorities.map(priority => (
                            <MenuItem key={priority} value={priority}>
                                {priority}
                            </MenuItem>
                        ))
                    }

                    {field === "status" &&
                        statuses.map(status => (
                            <MenuItem key={status} value={status}>
                                {status}
                            </MenuItem>
                        ))
                    }
                </TextField>
            ))}
        </Stack>
    );
}

export default function ServiceCallDataGrid() {
    const { user } = useAuth();
    const isAdmin = user?.role === "operations_admin";

    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [addOpen, setAddOpen] = useState(false);
    const [newCall, setNewCall] = useState({ ...emptyServiceCall });

    const [editOpen, setEditOpen] = useState(false);
    const [editCall, setEditCall] = useState(null);

    const [deleteId, setDeleteId] = useState(null);

    // GET SERVICE CALLS
    async function fetchServiceCalls() {
        setLoading(true);

        try {
            const res = await apiClient.get("/service/");
            setServiceCalls(res.data);
            setError("");
        } catch {
            setError("Failed to load service calls.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchServiceCalls();
    }, []);

    // ADD SERVICE CALL
    async function handleAdd() {
        try {
            await apiClient.post(
                "/service/",
                formatCall(newCall)
            );

            setAddOpen(false);
            setNewCall({ ...emptyServiceCall });
            await fetchServiceCalls();
        } catch (err) {
            setError(
                err.response?.data?.detail
                    ? JSON.stringify(err.response.data.detail)
                    : "Failed to add service call."
            );
        }
    }

    // EDIT SERVICE CALL
    function openEdit(row) {
        setEditCall({ ...row });
        setEditOpen(true);
    }

    async function handleEdit() {
        try {
            await apiClient.patch(
                `/service/${editCall.id}`,
                formatCall(editCall)
            );

            setEditOpen(false);
            setEditCall(null);
            await fetchServiceCalls();
        } catch (err) {
            setError(
                err.response?.data?.detail
                    ? JSON.stringify(err.response.data.detail)
                    : "Failed to update service call."
            );
        }
    }

    // DELETE SERVICE CALL
    async function handleDelete() {
        try {
            await apiClient.delete(`/service/${deleteId}`);

            setDeleteId(null);
            await fetchServiceCalls();
        } catch {
            setError("Failed to delete service call.");
        }
    }

    const columns = [
        { field: "id", headerName: "ID", width: 65 },
        { field: "title", headerName: "Title", flex: 2, minWidth: 180 },
        { field: "priority", headerName: "Priority", flex: 1, minWidth: 110 },
        { field: "status", headerName: "Status", flex: 1, minWidth: 120 },
        { field: "atm_id", headerName: "ATM ID", width: 100 },
        { field: "technician_id", headerName: "Technician ID", width: 125 }
    ];

    if (isAdmin) {
        columns.push({
            field: "actions",
            headerName: "Actions",
            width: 175,
            sortable: false,
            renderCell: ({ row }) => (
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ height: "100%" }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openEdit(row)}
                    >
                        Edit
                    </Button>

                    <Button
                        size="small"
                        color="error"
                        onClick={() => setDeleteId(row.id)}
                    >
                        Delete
                    </Button>
                </Stack>
            )
        });
    }

    return (
        <Box sx={{ width: "100%", minWidth: 0 }}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 2,
                    mb: 2
                }}
            >
                <Typography variant="h6">
                    Service Call Management
                </Typography>

                {isAdmin && (
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => setAddOpen(true)}
                    >
                        Add Service Call
                    </Button>
                )}
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            <DataGrid
                rows={serviceCalls}
                columns={columns}
                loading={loading}
                rowHeight={44}
                columnHeaderHeight={44}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 5,
                            page: 0
                        }
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

            {/* ADD */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Add Service Call</DialogTitle>

                <DialogContent>
                    <ServiceCallFields
                        call={newCall}
                        setter={setNewCall}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        color="success"
                        variant="contained"
                        onClick={handleAdd}
                    >
                        Add Service Call
                    </Button>
                </DialogActions>
            </Dialog>

            {/* EDIT */}
            <Dialog
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setEditCall(null);
                }}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Edit Service Call</DialogTitle>

                <DialogContent>
                    {editCall && (
                        <ServiceCallFields
                            call={editCall}
                            setter={setEditCall}
                        />
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => {
                            setEditOpen(false);
                            setEditCall(null);
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleEdit}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DELETE */}
            <Dialog
                open={deleteId !== null}
                onClose={() => setDeleteId(null)}
            >
                <DialogTitle>Delete Service Call</DialogTitle>

                <DialogContent>
                    Are you sure you want to delete service call {deleteId}?
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>
                        Cancel
                    </Button>

                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
