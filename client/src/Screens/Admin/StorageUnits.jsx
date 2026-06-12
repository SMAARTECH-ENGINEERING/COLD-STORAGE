import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiRefreshCw,
  FiBox, FiCpu, FiX, FiZap, FiChevronRight,
} from 'react-icons/fi';
import { MdOutlineEco } from 'react-icons/md';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  getStorageUnits, createStorageUnit, updateStorageUnit, deleteStorageUnit,
  assignDevice, removeDevice,
  assignVegetable, removeVegetable,
  updateStock, calculateCapacity,
} from '../../api/storageUnits.api';
import { getVegetables } from '../../api/vegetables.api';
import { getDevices }    from '../../api/devices.api';
import { getList, getPagination, getErrorMessage, getData } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const DIALOG_PAPER = { sx: { borderRadius: '12px' } };

const PACKING_DENSITIES = {
  potato: 650, onion: 550, carrot: 500, tomato: 450, cabbage: 400, apple: 430,
};

const emptyForm = {
  unitId: '', name: '', description: '', capacityTons: 5, location: '', currentStockKg: 0,
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const CardSkeleton = React.memo(() => (
  <div className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-100 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="h-2 bg-gray-100 rounded-full mb-3" />
    <div className="space-y-2">
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

// ─── Usage bar ─────────────────────────────────────────────────────────────────
const UsageBar = ({ pct }) => {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const StorageUnits = () => {
  const { isAdmin, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [units, setUnits]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 12;

  const [vegetables, setVegetables] = useState([]);
  const [allDevices, setAllDevices] = useState([]);

  // Create / Edit modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [editUnit, setEditUnit]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // Vegetable assign modal
  const [vegModal, setVegModal]         = useState(false);
  const [vegTarget, setVegTarget]       = useState(null);
  const [selectedVeg, setSelectedVeg]   = useState('');
  const [savingVeg, setSavingVeg]       = useState(false);

  // Device manage modal
  const [devModal, setDevModal]         = useState(false);
  const [devTarget, setDevTarget]       = useState(null);
  const [selectedDev, setSelectedDev]   = useState('');
  const [savingDev, setSavingDev]       = useState(false);

  // Stock update modal
  const [stockModal, setStockModal]     = useState(false);
  const [stockTarget, setStockTarget]   = useState(null);
  const [stockKg, setStockKg]           = useState(0);
  const [savingStock, setSavingStock]   = useState(false);

  // Capacity calculator modal
  const [calcModal, setCalcModal]       = useState(false);
  const [calcTarget, setCalcTarget]     = useState(null);
  const [calcVeg, setCalcVeg]           = useState('potato');
  const [calcAddKg, setCalcAddKg]       = useState(0);
  const [calcResult, setCalcResult]     = useState(null);
  const [calculating, setCalculating]   = useState(false);

  const searchTimer = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStorageUnits({ page, limit, ...(search && { search }) });
      setUnits(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load storage units'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  // Pre-load dropdowns
  useEffect(() => {
    getVegetables({ limit: 100, isActive: true }).then((r) => setVegetables(getList(r))).catch(() => {});
    getDevices({ limit: 100, isActive: true }).then((r) => setAllDevices(getList(r))).catch(() => {});
  }, []);

  const handleSearchChange = useCallback((e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 400);
  }, []);

  // ── Create / Edit ─────────────────────────────────────────────────────────
  const openCreate = useCallback(() => {
    setEditUnit(null); setForm(emptyForm); setModalOpen(true);
  }, []);

  const openEdit = useCallback((u) => {
    setEditUnit(u);
    setForm({
      unitId: u.unitId, name: u.name, description: u.description || '',
      capacityTons: u.capacityTons, location: u.location || '',
      currentStockKg: u.currentStockKg,
    });
    setModalOpen(true);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || (!editUnit && !form.unitId.trim())) {
      toast.error('Unit ID and name are required'); return;
    }
    if (!form.capacityTons || form.capacityTons <= 0) {
      toast.error('Capacity must be greater than 0'); return;
    }
    setSaving(true);
    try {
      if (editUnit) {
        await updateStorageUnit(editUnit._id, {
          name: form.name, description: form.description,
          location: form.location, capacityTons: form.capacityTons,
        });
        toast.success('Storage unit updated');
      } else {
        await createStorageUnit(form);
        toast.success('Storage unit created');
      }
      setModalOpen(false); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStorageUnit(deleteTarget._id);
      toast.success('Deleted successfully');
      setDeleteTarget(null); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Vegetable assignment ──────────────────────────────────────────────────
  const openVegModal = useCallback((u) => {
    setVegTarget(u); setSelectedVeg(u.assignedVegetable?._id || ''); setVegModal(true);
  }, []);

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
      setVegModal(false); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update vegetable'));
    } finally {
      setSavingVeg(false);
    }
  };

  // ── Device management ─────────────────────────────────────────────────────
  const openDevModal = useCallback((u) => {
    setDevTarget(u); setSelectedDev(''); setDevModal(true);
  }, []);

  const handleAddDevice = async () => {
    if (!selectedDev) { toast.error('Select a device'); return; }
    setSavingDev(true);
    try {
      const res = await assignDevice(devTarget._id, selectedDev);
      const updated = getData(res);
      setDevTarget(updated);
      setSelectedDev('');
      toast.success('Device assigned');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to assign device'));
    } finally {
      setSavingDev(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    setSavingDev(true);
    try {
      const res = await removeDevice(devTarget._id, deviceId);
      const updated = getData(res);
      setDevTarget(updated);
      toast.success('Device removed');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove device'));
    } finally {
      setSavingDev(false);
    }
  };

  // ── Stock update ──────────────────────────────────────────────────────────
  const openStockModal = useCallback((u) => {
    setStockTarget(u); setStockKg(u.currentStockKg); setStockModal(true);
  }, []);

  const handleSaveStock = async () => {
    if (stockKg < 0) { toast.error('Stock cannot be negative'); return; }
    setSavingStock(true);
    try {
      await updateStock(stockTarget._id, Number(stockKg));
      toast.success('Stock updated');
      setStockModal(false); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update stock'));
    } finally {
      setSavingStock(false);
    }
  };

  // ── Capacity calculator ───────────────────────────────────────────────────
  const openCalcModal = useCallback((u) => {
    setCalcTarget(u); setCalcVeg('potato'); setCalcAddKg(0); setCalcResult(null); setCalcModal(true);
  }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await calculateCapacity(calcTarget._id, {
        vegetable: calcVeg,
        addStockKg: calcAddKg || 0,
      });
      setCalcResult(getData(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Calculation failed'));
    } finally {
      setCalculating(false);
    }
  };

  // Devices not yet assigned to this unit (for dropdown)
  const availableDevicesForUnit = (unit) => {
    const assignedIds = (unit?.assignedDevices || []).map((d) => d._id || d);
    return allDevices.filter((d) => !assignedIds.includes(d._id));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Storage Units</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} cold storage chambers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors">
              <FiPlus size={16} /> Add Unit
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Search units…" onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : units.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <FiBox size={40} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No storage units found</p>
          {isAdmin && (
            <button onClick={openCreate} className="mt-4 text-sm text-[#2E3A8C] underline">Create your first unit</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => {
            const pct      = u.usagePercentage ?? 0;
            const maxKg    = u.maxCapacityKg    ?? u.capacityTons * 1000;
            const availKg  = u.availableCapacityKg ?? (maxKg - u.currentStockKg);
            const stockKg  = u.currentStockKg ?? 0;
            const pctColor = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-green-600';

            return (
              <div
                key={u._id}
                onClick={() => navigate(`/admin/storage-units/${u._id}`)}
                className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md hover:ring-2 hover:ring-[#2E3A8C]/20 transition-all cursor-pointer group flex flex-col gap-4"
              >

                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiBox size={20} className="text-[#2E3A8C]" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#2E3A8C] text-sm leading-tight group-hover:underline">{u.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{u.unitId}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="p-1 text-gray-400 hover:text-[#2E3A8C] rounded" title="Edit">
                          <FiEdit2 size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    )}
                    <FiChevronRight size={15} className="text-gray-300 group-hover:text-[#2E3A8C] transition-colors flex-shrink-0" />
                  </div>
                </div>

                {/* Capacity bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#49608c] font-medium">
                      {(u.capacityTons)} Ton · {maxKg.toLocaleString()} kg
                    </span>
                    <span className={`text-xs font-bold ${pctColor}`}>{pct}% full</span>
                  </div>
                  <UsageBar pct={pct} />
                  <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                    <span>Stored: <span className="font-semibold text-[#2E3A8C]">{stockKg.toLocaleString()} kg</span></span>
                    <span>Free: <span className="font-semibold text-green-600">{availKg.toLocaleString()} kg</span></span>
                  </div>
                </div>

                {/* Location */}
                {u.location && (
                  <p className="text-xs text-gray-400 truncate">{u.location}</p>
                )}

                {/* Vegetable badge */}
                <button
                  onClick={(e) => { e.stopPropagation(); isAdmin && openVegModal(u); }}
                  className={`self-start text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                    u.assignedVegetable
                      ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                  } ${!isAdmin && 'cursor-default pointer-events-none'}`}
                  title="Assign vegetable"
                >
                  <MdOutlineEco size={12} />
                  {u.assignedVegetable?.name || 'No vegetable assigned'}
                </button>

                {/* Devices */}
                <div className="flex flex-wrap gap-1.5">
                  {(u.assignedDevices || []).map((d) => (
                    <span key={d._id || d} className="text-xs bg-blue-50 text-[#2E3A8C] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono border border-blue-100">
                      <FiCpu size={10} />
                      {d.deviceId || d}
                    </span>
                  ))}
                  {(u.assignedDevices || []).length === 0 && (
                    <span className="text-xs text-gray-400">No sensors assigned</span>
                  )}
                </div>

                {/* Action row */}
                <div className="pt-1 border-t border-gray-100 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openStockModal(u); }}
                    className="text-xs px-3 py-1.5 bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] transition-colors flex items-center gap-1"
                  >
                    <FiZap size={11} /> Update Stock
                  </button>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openDevModal(u); }}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-[#49608c] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <FiCpu size={11} /> Manage Devices
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openCalcModal(u); }}
                    className="text-xs px-3 py-1.5 border border-blue-200 text-[#2E3A8C] rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                  >
                    <FiBox size={11} /> Capacity Calc
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Prev</button>
          <span className="text-sm text-gray-400">Page {page} of {pagination.totalPages}</span>
          <button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Next</button>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          {editUnit ? 'Edit Storage Unit' : 'Add Storage Unit'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            {!editUnit && (
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Unit ID *</label>
                <input type="text" value={form.unitId}
                  onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value.toUpperCase() }))}
                  placeholder="CS-UNIT-5T"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 font-mono" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Name *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Cold Chamber A — 5 Ton"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">
                Capacity (Tons) *
              </label>
              <input type="number" min={0.1} step={0.5} value={form.capacityTons}
                onChange={(e) => setForm((f) => ({ ...f, capacityTons: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
              {form.capacityTons > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  = {(form.capacityTons * 1000).toLocaleString()} kg max capacity
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Location</label>
              <input type="text" value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Warehouse Block A"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Primary potato cold storage…" rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 resize-none" />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editUnit ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Vegetable Modal ──────────────────────────────────────────── */}
      <Dialog open={vegModal} onClose={() => setVegModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Assign Vegetable</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c] mb-3">
            Select vegetable for <strong>{vegTarget?.name}</strong>
          </p>
          <select value={selectedVeg} onChange={(e) => setSelectedVeg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30">
            <option value="">— None —</option>
            {vegetables.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setVegModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSaveVeg} disabled={savingVeg}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {savingVeg && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Manage Devices Modal ────────────────────────────────────────────── */}
      <Dialog open={devModal} onClose={() => setDevModal(false)} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          Manage Devices — {devTarget?.name}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            {/* Currently assigned */}
            <div>
              <p className="text-xs font-semibold text-[#49608c] uppercase tracking-wide mb-2">Assigned Sensors</p>
              {(devTarget?.assignedDevices || []).length === 0 ? (
                <p className="text-xs text-gray-400">No devices assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {(devTarget?.assignedDevices || []).map((d) => (
                    <div key={d._id || d} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        <FiCpu size={12} className="text-[#2E3A8C]" />
                        <span className="font-mono font-semibold text-[#2E3A8C]">{d.deviceId || d}</span>
                        {d.name && <span className="text-gray-400">· {d.name}</span>}
                        {d.status && (
                          <span className={`px-1.5 py-0.5 rounded-full text-xs ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.status}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleRemoveDevice(d._id || d)} disabled={savingDev}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-40 rounded">
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add device */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-[#49608c] uppercase tracking-wide mb-2">Add Sensor</p>
              <div className="flex gap-2">
                <select value={selectedDev} onChange={(e) => setSelectedDev(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30">
                  <option value="">— Select device —</option>
                  {availableDevicesForUnit(devTarget).map((d) => (
                    <option key={d._id} value={d._id}>{d.deviceId} · {d.name}</option>
                  ))}
                </select>
                <button onClick={handleAddDevice} disabled={savingDev || !selectedDev}
                  className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-1.5">
                  {savingDev
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FiPlus size={14} />}
                  Add
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <button onClick={() => setDevModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
        </DialogActions>
      </Dialog>

      {/* ── Update Stock Modal ──────────────────────────────────────────────── */}
      <Dialog open={stockModal} onClose={() => setStockModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Update Stock</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c] mb-1">
            Unit: <strong>{stockTarget?.name}</strong>
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Max capacity: {((stockTarget?.capacityTons ?? 0) * 1000).toLocaleString()} kg
          </p>
          <label className="block text-sm font-medium text-[#49608c] mb-1">Current Stock (kg)</label>
          <input
            type="number" min={0} max={(stockTarget?.capacityTons ?? 0) * 1000}
            value={stockKg}
            onChange={(e) => setStockKg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
          {stockTarget && Number(stockKg) > 0 && (
            <p className="text-xs text-green-600 mt-1.5">
              Usage: {Math.round((Number(stockKg) / (stockTarget.capacityTons * 1000)) * 100)}% ·
              Available: {(stockTarget.capacityTons * 1000 - Number(stockKg)).toLocaleString()} kg
            </p>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setStockModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSaveStock} disabled={savingStock}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {savingStock && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Save
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Capacity Calculator Modal ───────────────────────────────────────── */}
      <Dialog open={calcModal} onClose={() => setCalcModal(false)} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          Capacity Calculator — {calcTarget?.name}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[#2E3A8C]">{calcTarget?.capacityTons} Ton</div>
                <div className="text-xs text-[#49608c]">Total Capacity</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-700">
                  {(calcTarget?.availableCapacityKg ?? 0).toLocaleString()} kg
                </div>
                <div className="text-xs text-[#49608c]">Currently Available</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Vegetable Type</label>
                <select value={calcVeg} onChange={(e) => setCalcVeg(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30">
                  {Object.entries(PACKING_DENSITIES).map(([k, v]) => (
                    <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)} ({v} kg/m³)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49608c] mb-1">Add Stock (kg)</label>
                <input type="number" min={0} value={calcAddKg}
                  onChange={(e) => setCalcAddKg(Number(e.target.value))}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
              </div>
            </div>

            <button onClick={handleCalculate} disabled={calculating}
              className="w-full py-2.5 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center justify-center gap-2 font-medium">
              {calculating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calculating…</>
                : 'Calculate'}
            </button>

            {/* Result */}
            {calcResult && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                <p className="text-xs font-semibold text-[#49608c] uppercase tracking-wide">Result</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-400">Max Capacity</div>
                    <div className="font-bold text-[#2E3A8C]">{calcResult.maxCapacityKg?.toLocaleString()} kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Current Stock</div>
                    <div className="font-bold text-[#2E3A8C]">{calcResult.currentStockKg?.toLocaleString()} kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Available</div>
                    <div className="font-bold text-green-600">{calcResult.availableCapacityKg?.toLocaleString()} kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Current Usage</div>
                    <div className="font-bold text-orange-600">{calcResult.usagePercentage}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Packing Density</div>
                    <div className="font-bold text-[#49608c]">{calcResult.packingDensityKgPerM3} kg/m³</div>
                  </div>
                </div>

                {calcResult.simulation && (
                  <div className={`rounded-lg p-3 text-sm ${calcResult.simulation.canFit ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`font-semibold mb-1 ${calcResult.simulation.canFit ? 'text-green-700' : 'text-yellow-700'}`}>
                      {calcResult.simulation.canFit
                        ? `✓ Yes — ${calcAddKg.toLocaleString()} kg of ${calcVeg} fits`
                        : `⚠ Only ${calcResult.simulation.canActuallyAddKg?.toLocaleString()} kg can fit (requested ${calcResult.simulation.requestedAddKg?.toLocaleString()} kg)`}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <span>After adding: <strong>{calcResult.simulation.stockAfterAddKg?.toLocaleString()} kg</strong></span>
                      <span>Usage after: <strong>{calcResult.simulation.usageAfterAdd}%</strong></span>
                    </div>
                    <UsageBar pct={calcResult.simulation.usageAfterAdd} />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <button onClick={() => setCalcModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Close</button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StorageUnits;
