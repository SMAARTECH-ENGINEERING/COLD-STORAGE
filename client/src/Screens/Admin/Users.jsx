import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheck, FiX, FiRefreshCw, FiCpu } from 'react-icons/fi';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getUsers, createUser, updateUser, deleteUser, activateUser, deactivateUser, assignDevices, removeDevices } from '../../api/users.api';
import { getDevices } from '../../api/devices.api';
import { getList, getPagination, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['super_admin', 'admin', 'operator', 'viewer'];
const roleColor = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin:       'bg-blue-100 text-blue-700',
  operator:    'bg-green-100 text-green-700',
  viewer:      'bg-gray-100 text-gray-600',
};
const emptyForm = { name: '', email: '', password: '', role: 'operator', phone: '' };
const DIALOG_PAPER    = { sx: { borderRadius: '12px' } };
const DIALOG_PAPER_LG = { sx: { borderRadius: '12px', maxHeight: '80vh' } };

const RowSkeleton = React.memo(({ cols }) => (
  <tr>
    {Array(cols).fill(0).map((_, i) => (
      <td key={i} className="px-5 py-3">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
      </td>
    ))}
  </tr>
));
RowSkeleton.displayName = 'RowSkeleton';

const Users = () => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toggling, setToggling]         = useState({});

  // Assign-devices modal
  const [devModalOpen, setDevModalOpen]     = useState(false);
  const [devTarget, setDevTarget]           = useState(null);
  const [allDevices, setAllDevices]         = useState([]);
  const [selectedDevIds, setSelectedDevIds] = useState(new Set());
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [savingDevices, setSavingDevices]   = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit,
        ...(search     && { search }),
        ...(roleFilter && { role: roleFilter }),
      };
      const res = await getUsers(params);
      setUsers(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  }, []);

  const openCreate = useCallback(() => {
    setEditUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role?.name || 'operator', phone: u.phone || '' });
    setModalOpen(true);
  }, []);

  const closeModal  = useCallback(() => setModalOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email are required'); return; }
    if (!editUser && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.password) payload.password = form.password;
      if (editUser) {
        await updateUser(editUser._id, payload);
        toast.success('User updated successfully');
      } else {
        await createUser(payload);
        toast.success('User created successfully');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = useCallback(async (u) => {
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
      toast.error(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setToggling((t) => ({ ...t, [u._id]: false }));
    }
  }, [load]);

  /* ── Assign Devices ──────────────────────────────────────────────────── */
  const openDevModal = useCallback(async (u) => {
    setDevTarget(u);
    // Pre-select currently assigned devices (handles both populated objects and bare IDs)
    const current = new Set(
      (u.assignedDevices || []).map((d) => (typeof d === 'string' ? d : d._id?.toString()))
    );
    setSelectedDevIds(current);
    setDevModalOpen(true);
    setLoadingDevices(true);
    try {
      const res = await getDevices({ limit: 100 });
      setAllDevices(getList(res));
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const closeDevModal = useCallback(() => setDevModalOpen(false), []);

  const toggleDevice = useCallback((id) => {
    setSelectedDevIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSaveDevices = async () => {
    const current = new Set(
      (devTarget.assignedDevices || []).map((d) => (typeof d === 'string' ? d : d._id?.toString()))
    );
    const toAdd    = [...selectedDevIds].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !selectedDevIds.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      setDevModalOpen(false);
      return;
    }

    setSavingDevices(true);
    try {
      await Promise.all([
        toAdd.length    > 0 ? assignDevices(devTarget._id, toAdd)    : null,
        toRemove.length > 0 ? removeDevices(devTarget._id, toRemove) : null,
      ].filter(Boolean));
      toast.success('Device assignment updated');
      setDevModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update devices'));
    } finally {
      setSavingDevices(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Users</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} total users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors">
            <FiPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search name or email…"
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f2f6fc] text-[#49608c] text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Name</th>
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Role</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Devices</th>
                <th className="text-left px-5 py-3 font-semibold">Last Login</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(5).fill(0).map((_, i) => <RowSkeleton key={i} cols={7} />)
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No users found</td>
                    </tr>
                  )
                  : users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#2E3A8C] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[#2E3A8C]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#49608c] text-xs">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleColor[u.role?.name] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role?.displayName || u.role?.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-[#49608c]">
                          {u.assignedDevices?.length > 0
                            ? <span className="bg-blue-50 text-[#2E3A8C] px-2 py-0.5 rounded-full border border-blue-100 font-medium">{u.assignedDevices.length} device{u.assignedDevices.length > 1 ? 's' : ''}</span>
                            : <span className="text-gray-400">None</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#49608c]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleActive(u)}
                            disabled={toggling[u._id]}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${u.isActive ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                          >
                            {toggling[u._id]
                              ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              : u.isActive ? <FiX size={15} /> : <FiCheck size={15} />}
                          </button>
                          <button onClick={() => openEdit(u)} className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors" title="Edit user">
                            <FiEdit2 size={15} />
                          </button>
                          {isAdmin && (
                            <button onClick={() => openDevModal(u)} className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors" title="Assign devices">
                              <FiCpu size={15} />
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {page} of {pagination.totalPages} · {pagination.total} users
            </span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Prev</button>
              <button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          {editUser ? 'Edit User' : 'Create User'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            {[
              { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'john@example.com' },
              { label: editUser ? 'New Password (blank = no change)' : 'Password *', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Phone', key: 'phone', type: 'text', placeholder: '+91 9876543210' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#49608c] mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editUser ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Assign Devices Modal */}
      <Dialog open={devModalOpen} onClose={closeDevModal} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER_LG}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          Assign Devices
          {devTarget && (
            <span className="block text-sm font-normal text-[#49608c] mt-0.5">{devTarget.name}</span>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {loadingDevices ? (
            <div className="flex items-center justify-center py-10 gap-2 text-[#49608c]">
              <div className="w-5 h-5 border-2 border-[#2E3A8C] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading devices…</span>
            </div>
          ) : allDevices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No devices found</div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">
                Select devices this user can access. Admins always have full access regardless of assignment.
              </p>
              {allDevices.map((d) => {
                const checked = selectedDevIds.has(d._id);
                return (
                  <label
                    key={d._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#2E3A8C] bg-[#f2f6fc]'
                        : 'border-gray-200 hover:border-[#2E3A8C]/40 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDevice(d._id)}
                      className="w-4 h-4 accent-[#2E3A8C] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#2E3A8C] truncate">{d.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{d.deviceId} · {d.location || 'No location'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${
                      d.status === 'online'  ? 'bg-green-100 text-green-700' :
                      d.status === 'offline' ? 'bg-red-100 text-red-700'    :
                                               'bg-yellow-100 text-yellow-700'
                    }`}>
                      {d.status}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
          <span className="text-xs text-gray-400">{selectedDevIds.size} device{selectedDevIds.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={closeDevModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSaveDevices} disabled={savingDevices} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
              {savingDevices && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save
            </button>
          </div>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeDelete} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Users;
