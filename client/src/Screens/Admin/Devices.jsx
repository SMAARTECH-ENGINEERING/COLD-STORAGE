import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiThermometer, FiDroplet, FiRefreshCw, FiWind, FiZap } from 'react-icons/fi';
import { MdDoorFront } from 'react-icons/md';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getDevices, createDevice, updateDevice, deleteDevice, assignVegetable, removeVegetable } from '../../api/devices.api';
import { getVegetables } from '../../api/vegetables.api';
import { getLatestReading } from '../../api/sensors.api';
import { getList, getPagination, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

const statusColor = {
  online:      'bg-green-100 text-green-700',
  offline:     'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
};
const emptyForm = {
  deviceId: '', name: '', location: '', description: '',
  alertThresholds: { doorOpenMinutes: 5, offlineMinutes: 10 },
};
const DIALOG_PAPER = { sx: { borderRadius: '12px' } };

const RowSkeleton = React.memo(() => (
  <tr>
    {Array(7).fill(0).map((_, i) => (
      <td key={i} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
    ))}
  </tr>
));
RowSkeleton.displayName = 'RowSkeleton';

const Devices = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [devices, setDevices]       = useState([]);
  const [vegetables, setVegetables] = useState([]);
  const [readings, setReadings]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 10;

  const [modalOpen, setModalOpen]   = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const [vegModalOpen, setVegModalOpen] = useState(false);
  const [vegTarget, setVegTarget]       = useState(null);
  const [selectedVeg, setSelectedVeg]   = useState('');
  const [savingVeg, setSavingVeg]       = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {
        page, limit,
        ...(search       && { search }),
        ...(statusFilter && { status: statusFilter }),
      };
      const res = await getDevices(params);
      const devList = getList(res);
      setDevices(devList);
      setPagination(getPagination(res));

      const readingMap = {};
      await Promise.allSettled(
        devList.map((d) =>
          getLatestReading(d.deviceId)
            .then(({ data }) => { readingMap[d.deviceId] = data.data; })
            .catch(() => {})
        )
      );
      setReadings(readingMap);
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Failed to load devices'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getVegetables({ limit: 100, isActive: true })
      .then((res) => setVegetables(getList(res)))
      .catch(() => {});
  }, []);

  const socketHandlers = useMemo(() => ({
    'sensor:reading': () => load(true),
    'device:status':  () => load(true),
  }), [load]);

  useSocket(socketHandlers);

  const handleSearchChange = useCallback((e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 400);
  }, []);

  const openCreate = useCallback(() => {
    setEditDevice(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((d) => {
    setEditDevice(d);
    setForm({
      deviceId: d.deviceId,
      name: d.name,
      location: d.location || '',
      description: d.description || '',
      alertThresholds: d.alertThresholds || { doorOpenMinutes: 5, offlineMinutes: 10 },
    });
    setModalOpen(true);
  }, []);

  const closeModal  = useCallback(() => setModalOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);
  const closeVeg    = useCallback(() => setVegModalOpen(false), []);

  const openVegModal = useCallback((d) => {
    setVegTarget(d);
    setSelectedVeg(d.assignedVegetable?._id || '');
    setVegModalOpen(true);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || (!editDevice && !form.deviceId.trim())) {
      toast.error('Device ID and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editDevice) {
        await updateDevice(editDevice._id, {
          name: form.name, location: form.location,
          description: form.description, alertThresholds: form.alertThresholds,
        });
        toast.success('Device updated');
      } else {
        await createDevice(form);
        toast.success('Device created');
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
      await deleteDevice(deleteTarget._id);
      toast.success('Device deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveVeg = async () => {
    setSavingVeg(true);
    try {
      if (selectedVeg) {
        await assignVegetable(vegTarget._id, selectedVeg);
        toast.success('Vegetable assigned');
      } else {
        await removeVegetable(vegTarget._id);
        toast.success('Vegetable removed');
      }
      setVegModalOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update'));
    } finally {
      setSavingVeg(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Devices</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} total devices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors">
              <FiPlus size={16} /> Add Device
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
            placeholder="Search devices…"
            onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
        >
          <option value="">All Statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f2f6fc] text-[#49608c] text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Device</th>
                <th className="text-left px-5 py-3 font-semibold">Location</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Latest Reading</th>
                <th className="text-left px-5 py-3 font-semibold">Vegetable</th>
                <th className="text-left px-5 py-3 font-semibold">Last Seen</th>
                {isAdmin && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(5).fill(0).map((_, i) => <RowSkeleton key={i} />)
                : devices.length === 0
                  ? <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No devices found</td></tr>
                  : devices.map((d) => {
                    const r = readings[d.deviceId];
                    return (
                      <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <button
                            onClick={() => navigate(`/admin/devices/${d._id}`)}
                            className="text-left group"
                          >
                            <div className="font-semibold text-[#2E3A8C] text-sm group-hover:underline">{d.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{d.deviceId}</div>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#49608c]">{d.location || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {r ? (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                              <span className="flex items-center gap-1">
                                <FiThermometer size={11} className="text-orange-500" />
                                <span className="font-semibold">{r.temperature?.toFixed(1)}°C</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <FiDroplet size={11} className="text-blue-500" />
                                <span className="font-semibold">{r.humidity?.toFixed(0)}%</span>
                              </span>
                              {r.voc != null && r.voc > 0 && (
                                <span className="flex items-center gap-1">
                                  <FiWind size={11} className="text-purple-500" />
                                  <span className="font-semibold text-purple-700">{r.voc}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <FiZap size={11} className={r.compressor ? 'text-blue-500' : 'text-gray-400'} />
                                <span className={r.compressor ? 'text-blue-600 font-semibold' : 'text-gray-400'}>
                                  {r.compressor ? 'On' : 'Off'}
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <MdDoorFront size={12} className={r.doorStatus === 'open' ? 'text-red-500' : 'text-green-500'} />
                                <span className={r.doorStatus === 'open' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                  {r.doorStatus}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No data</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => isAdmin && openVegModal(d)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              d.assignedVegetable
                                ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                            } ${!isAdmin && 'cursor-default pointer-events-none'}`}
                          >
                            {d.assignedVegetable?.name || 'None'}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#49608c]">
                          {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : '—'}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEdit(d)} className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors">
                                <FiEdit2 size={15} />
                              </button>
                              <button onClick={() => setDeleteTarget(d)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <FiTrash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Page {page} of {pagination.totalPages} · {pagination.total} devices</span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Prev</button>
              <button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>{editDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            {!editDevice && (
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Device ID *</label>
                <input type="text" value={form.deviceId} onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value.toUpperCase() }))} placeholder="CS001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 font-mono" />
              </div>
            )}
            {[
              { label: 'Name *',        key: 'name',        placeholder: 'Storage Unit A' },
              { label: 'Location',      key: 'location',    placeholder: 'Warehouse Block 1 - North' },
              { label: 'Description',   key: 'description', placeholder: 'Primary potato storage unit' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[#49608c] mb-1">{label}</label>
                <input type="text" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Door Open Alert (min)', key: 'doorOpenMinutes' },
                { label: 'Offline Alert (min)',   key: 'offlineMinutes' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#49608c] mb-1">{label}</label>
                  <input type="number" min={1} value={form.alertThresholds[key]}
                    onChange={(e) => setForm((f) => ({ ...f, alertThresholds: { ...f.alertThresholds, [key]: Number(e.target.value) } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editDevice ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Assign Vegetable Modal */}
      <Dialog open={vegModalOpen} onClose={closeVeg} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Assign Vegetable</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c] mb-3">Select vegetable profile for <strong>{vegTarget?.name}</strong></p>
          <select value={selectedVeg} onChange={(e) => setSelectedVeg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30">
            <option value="">— None —</option>
            {vegetables.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeVeg} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSaveVeg} disabled={savingVeg} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {savingVeg && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
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

export default Devices;
