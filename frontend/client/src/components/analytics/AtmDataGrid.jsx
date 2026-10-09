import { useEffect, useState } from "react";
import {
    Alert, Box, Button, Dialog, DialogActions,
    DialogContent, DialogTitle, MenuItem,
    Stack, TextField, Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../api/client";

const statuses = ["OPERATIONAL", "IN_TRANSPORT", "MAINTENANCE", "OFFLINE"];

const emptyAtm = {
    serial_number: "",
    model: "",
    status: "OPERATIONAL",
    cash_level: "",
    branch_id: "",
    technician_id: ""
};

const numberFields = [
    "serial_number", "cash_level", "branch_id", "technician_id"
];

function formatAtm(atm) {
    return {
        ...atm,
        serial_number: Number(atm.serial_number),
        cash_level: Number(atm.cash_level),
        branch_id: Number(atm.branch_id),
        technician_id: Number(atm.technician_id)
    };
}

export default function AtmDataGrid() {
    const { user } = useAuth();
    const isAdmin = user?.role === "operations_admin";

    const [atms, setAtms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [addOpen, setAddOpen] = useState(false);
    const [newAtm, setNewAtm] = useState({ ...emptyAtm });

    const [editOpen, setEditOpen] = useState(false);
    const [editAtm, setEditAtm] = useState(null);

    const [deleteId, setDeleteId] = useState(null);

    // GET ATMS
    async function fetchAtms() {
        setLoading(true);

        try {
            const res = await apiClient.get("/atm/");
            setAtms(res.data);
            setError("");
        } catch {
            setError("Failed to load ATMs.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAtms();
    }, []);

    // ADD ATM
    function handleChange(e) {
        setNewAtm({
            ...newAtm,
            [e.target.name]: e.target.value
        });
    }

    async function handleAdd() {
        try {
            await apiClient.post("/atm/", formatAtm(newAtm));

            setAddOpen(false);
            setNewAtm({ ...emptyAtm });
            await fetchAtms();
        } catch (err) {
            setError(
                err.response?.data?.detail
                    ? JSON.stringify(err.response.data.detail)
                    : "Failed to add ATM."
            );
        }
    }

    // EDIT ATM
    function handleEditOpen(atm) {
        setEditAtm({ ...atm });
        setEditOpen(true);
    }

    function handleEditChange(e) {
        setEditAtm({
            ...editAtm,
            [e.target.name]: e.target.value
        });
    }

    async function handleEdit() {
        try {
            await apiClient.patch(
                `/atm/${editAtm.id}`,
                formatAtm(editAtm)
            );

            setEditOpen(false);
            setEditAtm(null);
            await fetchAtms();
        } catch (err) {
            setError(
                err.response?.data?.detail
                    ? JSON.stringify(err.response.data.detail)
                    : "Failed to update ATM."
            );
        }
    }

    // DELETE ATM
    async function handleDelete() {
        try {
            await apiClient.delete(`/atm/${deleteId}`);

            setDeleteId(null);
            await fetchAtms();
        } catch {
            setError("Failed to delete ATM.");
        }
    }

    // COLUMNS
    const columns = [
        { field: "id", headerName: "ID", width: 65 },
        {
            field: "serial_number",
            headerName: "Serial Number",
            flex: 1,
            minWidth: 125
        },
        {
            field: "model",
            headerName: "Model",
            flex: 1,
            minWidth: 120
        },
        {
            field: "status",
            headerName: "Status",
            flex: 1,
            minWidth: 135
        },
        {
            field: "cash_level",
            headerName: "Cash (%)",
            width: 105,
            cellClassName: (params) =>
                Number(params.value) < 20 ? "low-cash-cell" : ""
        },
        {
            field: "branch_id",
            headerName: "Branch ID",
            width: 105
        },
        {
            field: "technician_id",
            headerName: "Technician ID",
            width: 125
        }
    ];

    // ADMIN ACTIONS
    if (isAdmin) {
        columns.push({
            field: "actions",
            headerName: "Actions",
            width: 175,
            sortable: false,
            filterable: false,
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
                        onClick={() => handleEditOpen(row)}
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
            {/* HEADER */}
            <Box
                sx={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    alignItems: "center",
                    gap: 2,
                    mb: 2
                }}
            >
                <Typography variant="h6">
                    ATM Management
                </Typography>

                {isAdmin && (
                    <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => setAddOpen(true)}
                    >
                        Add ATM
                    </Button>
                )}
            </Box>

            {/* ERROR */}
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            )}

            {/* DATA GRID */}
            <DataGrid
                rows={atms}
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
                    fontSize: 13,
                    "& .low-cash-cell": {
                        backgroundColor: "#ffcccc"
                    },
                    "& .low-cash-cell:hover": {
                        backgroundColor: "#ffaaaa"
                    }
                }}
            />

            {/* ADD ATM DIALOG */}
            <Dialog
                open={addOpen}
                onClose={() => setAddOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Add ATM</DialogTitle>

                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {Object.keys(emptyAtm).map((field) => (
                            <TextField
                                key={field}
                                select={field === "status"}
                                label={field.replaceAll("_", " ").toUpperCase()}
                                name={field}
                                type={
                                    numberFields.includes(field)
                                        ? "number"
                                        : "text"
                                }
                                value={newAtm[field]}
                                onChange={handleChange}
                                size="small"
                                required
                                fullWidth
                            >
                                {field === "status" &&
                                    statuses.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        ))}
                    </Stack>
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
                        Add ATM
                    </Button>
                </DialogActions>
            </Dialog>

            {/* EDIT ATM DIALOG */}
            <Dialog
                open={editOpen}
                onClose={() => {
                    setEditOpen(false);
                    setEditAtm(null);
                }}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Edit ATM</DialogTitle>

                <DialogContent>
                    {editAtm && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {Object.keys(emptyAtm).map((field) => (
                                <TextField
                                    key={field}
                                    select={field === "status"}
                                    label={field.replaceAll("_", " ").toUpperCase()}
                                    name={field}
                                    type={
                                        numberFields.includes(field)
                                            ? "number"
                                            : "text"
                                    }
                                    value={editAtm[field] ?? ""}
                                    onChange={handleEditChange}
                                    size="small"
                                    fullWidth
                                >
                                    {field === "status" &&
                                        statuses.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                </TextField>
                            ))}
                        </Stack>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={() => {
                            setEditOpen(false);
                            setEditAtm(null);
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

            {/* DELETE ATM DIALOG */}
            <Dialog
                open={deleteId !== null}
                onClose={() => setDeleteId(null)}
            >
                <DialogTitle>Delete ATM</DialogTitle>

                <DialogContent>
                    Are you sure you want to delete ATM {deleteId}?
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
