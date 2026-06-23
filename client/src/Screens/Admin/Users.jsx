import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import DataTable from "react-data-table-component";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiCpu,
  FiBox,
} from "react-icons/fi";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  assignDevices,
  removeDevices,
  assignStorageUnits,
  removeStorageUnits,
} from "../../api/users.api";
import { getRoles as getRolesList } from "../../api/roles.api";
import { getDevices } from "../../api/devices.api";
import { getStorageUnits } from "../../api/storageUnits.api";
import { getList, getPagination, getErrorMessage } from "../../utils/api.utils";
import { getRoleColor } from "../../utils/roleColor";
import { useAuth } from "../../context/AuthContext";

const emptyForm = { name: "", email: "", password: "", role: "", phone: "" };
const DIALOG_PAPER = { sx: { borderRadius: "12px" } };
const DIALOG_PAPER_LG = { sx: { borderRadius: "12px", maxHeight: "80vh" } };

const tableCustomStyles = {
  tableWrapper: {
    style: {
      borderRadius: "12px",
      overflow: "hidden",
    },
  },
  headRow: {
    style: {
      backgroundColor: "#f2f6fc",
      borderBottomWidth: "0",
      minHeight: "40px",
    },
  },
  headCells: {
    style: {
      color: "#49608c",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      paddingLeft: "20px",
      paddingRight: "20px",
    },
  },
  rows: {
    style: {
      fontSize: "13px",
      borderBottomColor: "#f9fafb",
      minHeight: "52px",
      "&:hover": { backgroundColor: "#f9fafb" },
    },
  },
  cells: {
    style: {
      paddingLeft: "20px",
      paddingRight: "20px",
    },
  },
  pagination: {
    style: {
      borderTopColor: "#f3f4f6",
      fontSize: "12px",
      color: "#9ca3af",
    },
  },
};

const LoadingSkeleton = () => (
  <div className="divide-y divide-gray-50">
    {Array(5)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-3.5">
          {Array(7)
            .fill(0)
            .map((__, j) => (
              <div
                key={j}
                className="h-4 bg-gray-100 rounded animate-pulse flex-1"
              />
            ))}
        </div>
      ))}
  </div>
);

const NoDataComponent = () => (
  <div className="py-12 text-center text-gray-400 text-sm">No users found</div>
);

const Users = () => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState({});

  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devTarget, setDevTarget] = useState(null);
  const [allDevices, setAllDevices] = useState([]);
  const [selectedDevIds, setSelectedDevIds] = useState(new Set());
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [savingDevices, setSavingDevices] = useState(false);

  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [unitTarget, setUnitTarget] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingUnits, setSavingUnits] = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      };
      const res = await getUsers(params);
      setUsers(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      setRolesLoading(true);
      try {
        const res = await getRolesList({ limit: 100, isActive: true });
        setRoles(getList(res));
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load roles"));
      } finally {
        setRolesLoading(false);
      }
    })();
  }, []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  }, []);

  const openCreate = useCallback(() => {
    setEditUser(null);
    setForm({ ...emptyForm, role: roles[0]?.name || "" });
    setModalOpen(true);
  }, [roles]);

  const openEdit = useCallback((u) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role?.name || "",
      phone: u.phone || "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!editUser && !form.password) {
      toast.error("Password is required for new users");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.password) payload.password = form.password;
      if (editUser) {
        await updateUser(editUser._id, payload);
        toast.success("User updated successfully");
      } else {
        await createUser(payload);
        toast.success("User created successfully");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success("User deleted");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = useCallback(
    async (u) => {
      setToggling((t) => ({ ...t, [u._id]: true }));
      try {
        if (u.isActive) {
          await deactivateUser(u._id);
          toast.success(`${u.name} deactivated`);
        } else {
          await activateUser(u._id);
          toast.success(`${u.name} activated`);
        }
        load();
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to update status"));
      } finally {
        setToggling((t) => ({ ...t, [u._id]: false }));
      }
    },
    [load],
  );

  const openDevModal = useCallback(async (u) => {
    setDevTarget(u);
    const current = new Set(
      (u.assignedDevices || []).map((d) =>
        typeof d === "string" ? d : d._id?.toString(),
      ),
    );
    setSelectedDevIds(current);
    setDevModalOpen(true);
    setLoadingDevices(true);
    try {
      const res = await getDevices({ limit: 100 });
      setAllDevices(getList(res));
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const closeDevModal = useCallback(() => setDevModalOpen(false), []);

  const toggleDevice = useCallback((id) => {
    setSelectedDevIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSaveDevices = async () => {
    const current = new Set(
      (devTarget.assignedDevices || []).map((d) =>
        typeof d === "string" ? d : d._id?.toString(),
      ),
    );
    const toAdd = [...selectedDevIds].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !selectedDevIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      setDevModalOpen(false);
      return;
    }

    setSavingDevices(true);
    try {
      await Promise.all(
        [
          toAdd.length > 0 ? assignDevices(devTarget._id, toAdd) : null,
          toRemove.length > 0 ? removeDevices(devTarget._id, toRemove) : null,
        ].filter(Boolean),
      );
      toast.success("Device assignment updated");
      setDevModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update devices"));
    } finally {
      setSavingDevices(false);
    }
  };

  const openUnitModal = useCallback(async (u) => {
    setUnitTarget(u);
    const current = new Set(
      (u.assignedStorageUnits || []).map((s) =>
        typeof s === "string" ? s : s._id?.toString(),
      ),
    );
    setSelectedUnitIds(current);
    setUnitModalOpen(true);
    setLoadingUnits(true);
    try {
      const res = await getStorageUnits({ limit: 100 });
      setAllUnits(getList(res));
    } catch {
      toast.error("Failed to load storage units");
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  const closeUnitModal = useCallback(() => setUnitModalOpen(false), []);

  const toggleUnit = useCallback((id) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSaveUnits = async () => {
    const current = new Set(
      (unitTarget.assignedStorageUnits || []).map((s) =>
        typeof s === "string" ? s : s._id?.toString(),
      ),
    );
    const toAdd = [...selectedUnitIds].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !selectedUnitIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      setUnitModalOpen(false);
      return;
    }

    setSavingUnits(true);
    try {
      await Promise.all(
        [
          toAdd.length > 0 ? assignStorageUnits(unitTarget._id, toAdd) : null,
          toRemove.length > 0
            ? removeStorageUnits(unitTarget._id, toRemove)
            : null,
        ].filter(Boolean),
      );
      toast.success("Storage unit assignment updated");
      setUnitModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update storage units"));
    } finally {
      setSavingUnits(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        name: "Name",
        minWidth: "160px",
        cell: (u) => (
          <div className="flex items-center gap-2 py-1">
            <div className="w-8 h-8 bg-[#2E3A8C] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-[#2E3A8C] text-sm">{u.name}</span>
          </div>
        ),
      },
      {
        name: "Email",
        minWidth: "180px",
        cell: (u) => <span className="text-xs text-[#49608c]">{u.email}</span>,
      },
      {
        name: "Role",
        minWidth: "110px",
        cell: (u) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleColor(u.role?.name)}`}
          >
            {u.role?.displayName || u.role?.name}
          </span>
        ),
      },
      {
        name: "Status",
        minWidth: "90px",
        cell: (u) => (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
          >
            {u.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        name: "Devices",
        minWidth: "100px",
        cell: (u) =>
          u.assignedDevices?.length > 0 ? (
            <span className="text-xs bg-blue-50 text-[#2E3A8C] px-2 py-0.5 rounded-full border border-blue-100 font-medium">
              {u.assignedDevices.length} device
              {u.assignedDevices.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-gray-400">None</span>
          ),
      },
      {
        name: "Storage Units",
        minWidth: "120px",
        cell: (u) =>
          u.assignedStorageUnits?.length > 0 ? (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-medium">
              {u.assignedStorageUnits.length} unit
              {u.assignedStorageUnits.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-gray-400">None</span>
          ),
      },
      {
        name: "Last Login",
        minWidth: "120px",
        cell: (u) => (
          <span className="text-xs text-[#49608c]">
            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
          </span>
        ),
      },
      {
        name: "Actions",
        right: true,
        minWidth: "130px",
        cell: (u) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleActive(u)}
              disabled={toggling[u._id]}
              title={u.isActive ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${u.isActive ? "text-red-400 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}`}
            >
              {toggling[u._id] ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : u.isActive ? (
                <FiX size={15} />
              ) : (
                <FiCheck size={15} />
              )}
            </button>
            <button
              onClick={() => openEdit(u)}
              className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit user"
            >
              <FiEdit2 size={15} />
            </button>
            {isAdmin && (
              <button
                onClick={() => openDevModal(u)}
                className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors"
                title="Assign devices"
              >
                <FiCpu size={15} />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => openUnitModal(u)}
                className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors"
                title="Assign storage units"
              >
                <FiBox size={15} />
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={() => setDeleteTarget(u)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete user"
              >
                <FiTrash2 size={15} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [
      isAdmin,
      isSuperAdmin,
      toggling,
      toggleActive,
      openEdit,
      openDevModal,
      openUnitModal,
    ],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Users</h1>
          <p className="text-sm text-[#49608c]">
            {pagination.total} total users
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors"
          >
            <FiPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            type="text"
            placeholder="Search name or email…"
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r.name}>
              {r.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={users}
          progressPending={loading}
          progressComponent={<LoadingSkeleton />}
          noDataComponent={<NoDataComponent />}
          customStyles={tableCustomStyles}
          responsive
          pagination
          paginationServer
          paginationTotalRows={pagination.total}
          paginationPerPage={limit}
          paginationDefaultPage={page}
          onChangePage={(p) => setPage(p)}
          paginationComponentOptions={{ noRowsPerPage: true }}
          highlightOnHover
          persistTableHead
        />
      </div>

      {/* Create / Edit Modal */}
      <Dialog
        open={modalOpen}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
        PaperProps={DIALOG_PAPER}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#2E3A8C", fontSize: 18 }}>
          {editUser ? "Edit User" : "Create User"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            {[
              {
                label: "Full Name *",
                key: "name",
                type: "text",
                placeholder: "John Doe",
              },
              {
                label: "Email *",
                key: "email",
                type: "email",
                placeholder: "john@example.com",
              },
              {
                label: editUser
                  ? "New Password (blank = no change)"
                  : "Password *",
                key: "password",
                type: "password",
                placeholder: "••••••••",
              },
              {
                label: "Phone",
                key: "phone",
                type: "text",
                placeholder: "+91 9876543210",
              },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#49608c] mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">
                Role
              </label>
              <select
                value={form.role}
                disabled={rolesLoading}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 disabled:bg-gray-50"
              >
                {roles.map((r) => (
                  <option key={r._id} value={r.name}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2"
          >
            {saving && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {editUser ? "Update" : "Create"}
          </button>
        </DialogActions>
      </Dialog>

      {/* Assign Devices Modal */}
      <Dialog
        open={devModalOpen}
        onClose={closeDevModal}
        maxWidth="sm"
        fullWidth
        PaperProps={DIALOG_PAPER_LG}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#2E3A8C", fontSize: 18 }}>
          Assign Devices
          {devTarget && (
            <span className="block text-sm font-normal text-[#49608c] mt-0.5">
              {devTarget.name}
            </span>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDevices ? (
            <div className="flex items-center justify-center py-10 gap-2 text-[#49608c]">
              <div className="w-5 h-5 border-2 border-[#2E3A8C] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading devices…</span>
            </div>
          ) : allDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No devices found
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">
                Select devices this user can access. Admins always have full
                access regardless of assignment.
              </p>
              {allDevices.map((d) => {
                const checked = selectedDevIds.has(d._id);
                return (
                  <label
                    key={d._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-[#2E3A8C] bg-[#f2f6fc]"
                        : "border-gray-200 hover:border-[#2E3A8C]/40 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDevice(d._id)}
                      className="w-4 h-4 accent-[#2E3A8C] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2E3A8C] truncate">
                        {d.name}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {d.deviceId} · {d.location || "No location"}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${
                        d.status === "online"
                          ? "bg-green-100 text-green-700"
                          : d.status === "offline"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, gap: 1, justifyContent: "space-between" }}
        >
          <span className="text-xs text-gray-400">
            {selectedDevIds.size} device{selectedDevIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={closeDevModal}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDevices}
              disabled={savingDevices}
              className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2"
            >
              {savingDevices && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Assign Storage Units Modal */}
      <Dialog
        open={unitModalOpen}
        onClose={closeUnitModal}
        maxWidth="sm"
        fullWidth
        PaperProps={DIALOG_PAPER_LG}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#2E3A8C", fontSize: 18 }}>
          Assign Storage Units
          {unitTarget && (
            <span className="block text-sm font-normal text-[#49608c] mt-0.5">
              {unitTarget.name}
            </span>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingUnits ? (
            <div className="flex items-center justify-center py-10 gap-2 text-[#49608c]">
              <div className="w-5 h-5 border-2 border-[#2E3A8C] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading storage units…</span>
            </div>
          ) : allUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No storage units found
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">
                Select storage units this user is responsible for. Admins always
                have full access regardless of assignment.
              </p>
              {allUnits.map((s) => {
                const checked = selectedUnitIds.has(s._id);
                return (
                  <label
                    key={s._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? "border-[#2E3A8C] bg-[#f2f6fc]"
                        : "border-gray-200 hover:border-[#2E3A8C]/40 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUnit(s._id)}
                      className="w-4 h-4 accent-[#2E3A8C] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2E3A8C] truncate">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {s.unitId} · {s.location || "No location"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, gap: 1, justifyContent: "space-between" }}
        >
          <span className="text-xs text-gray-400">
            {selectedUnitIds.size} unit{selectedUnitIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={closeUnitModal}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUnits}
              disabled={savingUnits}
              className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2"
            >
              {savingUnits && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Save
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={closeDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={DIALOG_PAPER}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#2E3A8C" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button
            onClick={closeDelete}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;
