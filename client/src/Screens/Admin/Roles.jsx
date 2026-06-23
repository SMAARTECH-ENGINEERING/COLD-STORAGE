import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw, FiShield } from 'react-icons/fi';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  getRoles, createRole, updateRole, deleteRole, getPermissionCatalog,
} from '../../api/roles.api';
import { getList, getPagination, getErrorMessage } from '../../utils/api.utils';
import { getRoleColor } from '../../utils/roleColor';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', displayName: '', description: '', isActive: true, permissions: [] };

const DIALOG_PAPER    = { sx: { borderRadius: '12px' } };
const DIALOG_PAPER_LG = { sx: { borderRadius: '12px', maxHeight: '85vh' } };

const tableCustomStyles = {
  tableWrapper: { style: { borderRadius: '12px', overflow: 'hidden' } },
  headRow: { style: { backgroundColor: '#f2f6fc', borderBottomWidth: '0', minHeight: '40px' } },
  headCells: {
    style: {
      color: '#49608c', fontSize: '11px', fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '20px', paddingRight: '20px',
    },
  },
  rows: {
    style: {
      fontSize: '13px', borderBottomColor: '#f9fafb', minHeight: '52px',
      '&:hover': { backgroundColor: '#f9fafb' },
    },
  },
  cells: { style: { paddingLeft: '20px', paddingRight: '20px' } },
  pagination: { style: { borderTopColor: '#f3f4f6', fontSize: '12px', color: '#9ca3af' } },
};

const LoadingSkeleton = () => (
  <div className="divide-y divide-gray-50">
    {Array(5).fill(0).map((_, i) => (
      <div key={i} className="flex gap-4 px-5 py-3.5">
        {Array(5).fill(0).map((__, j) => (
          <div key={j} className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const NoDataComponent = () => (
  <div className="py-12 text-center text-gray-400 text-sm">No roles found</div>
);

// Derives which quick-preset a resource's selected actions match, given the
// full set of actions the catalog says are available for that resource.
const presetForActions = (actions, availableActions) => {
  if (!actions || actions.length === 0) return 'none';
  if (availableActions.every((a) => actions.includes(a)) && actions.length === availableActions.length) return 'full';
  if (actions.length === 1 && actions[0] === 'read') return 'readonly';
  return 'custom';
};

const Roles = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('roles', 'create');
  const canUpdate = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');

  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0 });
  const limit = 10;

  const [catalog, setCatalog]             = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole]   = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, ...(search && { search }) };
      const res = await getRoles(params);
      setRoles(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load roles'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      setCatalogLoading(true);
      try {
        const res = await getPermissionCatalog();
        setCatalog(getList(res));
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load permission catalog'));
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
  }, []);

  const buildFormPermissions = (permissions = []) =>
    catalog.map((entry) => {
      const existing = permissions.find((p) => p.resource === entry.resource);
      return { resource: entry.resource, actions: existing ? [...existing.actions] : [] };
    });

  const openCreate = useCallback(() => {
    setEditRole(null);
    setForm({ ...emptyForm, permissions: buildFormPermissions([]) });
    setModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const openEdit = useCallback((r) => {
    setEditRole(r);
    setForm({
      name: r.name,
      displayName: r.displayName,
      description: r.description || '',
      isActive: r.isActive,
      permissions: buildFormPermissions(r.permissions || []),
    });
    setModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  const closeModal  = useCallback(() => setModalOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const setResourcePreset = (resource, preset, availableActions) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.map((p) => {
        if (p.resource !== resource) return p;
        if (preset === 'none') return { ...p, actions: [] };
        if (preset === 'readonly') return { ...p, actions: availableActions.includes('read') ? ['read'] : [availableActions[0]] };
        if (preset === 'full') return { ...p, actions: [...availableActions] };
        return p; // custom — leave actions as-is, edited via the dropdown
      }),
    }));
  };

  const setResourceActions = (resource, actions) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.map((p) => (p.resource === resource ? { ...p, actions } : p)),
    }));
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) { toast.error('Display name is required'); return; }
    if (!editRole && !form.name.trim()) { toast.error('Role name is required'); return; }

    setSaving(true);
    try {
      const payload = {
        displayName: form.displayName.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        permissions: form.permissions.filter((p) => p.actions.length > 0),
      };
      if (!editRole) payload.name = form.name.trim().toLowerCase();

      if (editRole) {
        await updateRole(editRole._id, payload);
        toast.success('Role updated successfully');
      } else {
        await createRole(payload);
        toast.success('Role created successfully');
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
      await deleteRole(deleteTarget._id);
      toast.success('Role deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      name: 'Role',
      minWidth: '160px',
      cell: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleColor(r.name)}`}>
          {r.displayName}
        </span>
      ),
    },
    {
      name: 'Name (key)',
      minWidth: '140px',
      cell: (r) => <span className="text-xs font-mono text-gray-500">{r.name}</span>,
    },
    {
      name: 'Description',
      minWidth: '200px',
      cell: (r) => <span className="text-xs text-[#49608c]">{r.description || '—'}</span>,
    },
    {
      name: 'Permissions',
      minWidth: '120px',
      cell: (r) => (
        <span className="text-xs bg-blue-50 text-[#2E3A8C] px-2 py-0.5 rounded-full border border-blue-100 font-medium">
          {(r.permissions || []).reduce((sum, p) => sum + p.actions.length, 0)} grants
        </span>
      ),
    },
    {
      name: 'Status',
      minWidth: '90px',
      cell: (r) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      name: 'Actions',
      right: true,
      minWidth: '100px',
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          {canUpdate && (
            <button onClick={() => openEdit(r)} className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors" title="Edit role">
              <FiEdit2 size={15} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => setDeleteTarget(r)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete role">
              <FiTrash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ], [canUpdate, canDelete, openEdit]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C] flex items-center gap-2"><FiShield size={20} /> Roles & Permissions</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} total roles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {canCreate && (
            <button onClick={openCreate} disabled={catalogLoading} className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors disabled:opacity-60">
              <FiPlus size={16} /> Add Role
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search role name…"
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={roles}
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
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="md" fullWidth PaperProps={DIALOG_PAPER_LG}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          {editRole ? 'Edit Role' : 'Create Role'}
        </DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Role Key (lowercase, unique) *</label>
                <input
                  type="text"
                  value={form.name}
                  disabled={Boolean(editRole)}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase() }))}
                  placeholder="e.g. inventory_manager"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Display Name *</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder="Inventory Manager"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What this role is for…"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-2">Status</label>
              <div className="flex gap-5">
                {[{ v: true, l: 'Active' }, { v: false, l: 'Inactive' }].map(({ v, l }) => (
                  <label key={l} className="flex items-center gap-2 text-sm text-[#49608c] cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={form.isActive === v}
                      onChange={() => setForm((f) => ({ ...f, isActive: v }))}
                      className="w-4 h-4 accent-[#2E3A8C]"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-2">Permissions</label>
              {catalogLoading ? (
                <div className="text-xs text-gray-400">Loading permission catalog…</div>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {catalog.map((entry) => {
                    const current = form.permissions.find((p) => p.resource === entry.resource) || { actions: [] };
                    const preset = presetForActions(current.actions, entry.actions);
                    return (
                      <div key={entry.resource} className="p-3 flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-[#2E3A8C] capitalize w-32 flex-shrink-0">
                          {entry.resource.replace('_', ' ')}
                        </span>

                        {/* Radio presets — quick access levels, sourced from the resource's own action set */}
                        <div className="flex gap-3 flex-wrap">
                          {[
                            { v: 'none', l: 'None' },
                            ...(entry.actions.includes('read') ? [{ v: 'readonly', l: 'Read Only' }] : []),
                            { v: 'full', l: 'Full Access' },
                            { v: 'custom', l: 'Custom' },
                          ].map(({ v, l }) => (
                            <label key={v} className="flex items-center gap-1.5 text-xs text-[#49608c] cursor-pointer">
                              <input
                                type="radio"
                                name={`preset-${entry.resource}`}
                                checked={preset === v}
                                onChange={() => setResourcePreset(entry.resource, v, entry.actions)}
                                className="w-3.5 h-3.5 accent-[#2E3A8C]"
                              />
                              {l}
                            </label>
                          ))}
                        </div>

                        {/* Custom action multi-select dropdown, populated entirely from the catalog */}
                        {preset === 'custom' && (
                          <select
                            multiple
                            value={current.actions}
                            onChange={(e) => setResourceActions(
                              entry.resource,
                              Array.from(e.target.selectedOptions, (o) => o.value)
                            )}
                            className="ml-auto px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 min-w-32"
                            size={Math.min(entry.actions.length, 4)}
                          >
                            {entry.actions.map((a) => (
                              <option key={a} value={a} className="capitalize">{a}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editRole ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">
            Delete <strong>{deleteTarget?.displayName}</strong>? Users assigned to this role must be reassigned first.
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

export default Roles;
