import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiBox, FiCpu, FiEdit2, FiTrash2,
  FiZap, FiRefreshCw, FiMapPin, FiX, FiPlus,
} from 'react-icons/fi';
import { MdOutlineEco } from 'react-icons/md';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  getStorageUnit,
  updateStorageUnit, deleteStorageUnit,
  assignDevice, removeDevice,
  assignVegetable, removeVegetable,
  updateStock, calculateCapacity,
} from '../../api/storageUnits.api';
import { getVegetables } from '../../api/vegetables.api';
import { getDevices } from '../../api/devices.api';
import { getData, getList, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const DIALOG_PAPER = { sx: { borderRadius: '12px' } };

const PACKING_DENSITIES = {
  potato: 650, onion: 550, carrot: 500, tomato: 450, cabbage: 400, apple: 430,
};

const UsageBar = ({ pct }) => {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-3">
      <div className={`h-3 rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
};

const StatBox = ({ label, value, sub, color = 'text-[#2E3A8C]' }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-[#49608c] mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
);

const StorageUnitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  const [vegetables, setVegetables] = useState([]);
  const [allDevices, setAllDevices] = useState([]);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Vegetable modal
  const [vegModal, setVegModal] = useState(false);
  const [selectedVeg, setSelectedVeg] = useState('');
  const [savingVeg, setSavingVeg] = useState(false);

  // Device modal
  const [devModal, setDevModal] = useState(false);
  const [selectedDev, setSelectedDev] = useState('');
  const [savingDev, setSavingDev] = useState(false);

  // Stock modal
  const [stockModal, setStockModal] = useState(false);
  const [stockKg, setStockKg] = useState(0);
  const [savingStock, setSavingStock] = useState(false);

  // Capacity calculator
  const [calcModal, setCalcModal] = useState(false);
  const [calcVeg, setCalcVeg] = useState('potato');
  const [calcAddKg, setCalcAddKg] = useState(0);
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStorageUnit(id);
      setUnit(getData(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load storage unit'));
      navigate('/admin/storage-units');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getVegetables({ limit: 100, isActive: true }).then((r) => setVegetables(getList(r))).catch(() => {});
    getDevices({ limit: 100, isActive: true }).then((r) => setAllDevices(getList(r))).catch(() => {});
  }, []);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = () => {
    setEditForm({
      name: unit.name, description: unit.description || '',
      capacityTons: unit.capacityTons, location: unit.location || '',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editForm.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await updateStorageUnit(id, editForm);
      toast.success('Storage unit updated');
      setEditModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStorageUnit(id);
      toast.success('Storage unit deleted');
      navigate('/admin/storage-units');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
      setDeleting(false);
    }
  };

  // ── Vegetable ─────────────────────────────────────────────────────────────
  const openVeg = () => { setSelectedVeg(unit.assignedVegetable?._id || ''); setVegModal(true); };
  const handleSaveVeg = async () => {
    setSavingVeg(true);
    try {
      if (selectedVeg) {
        await assignVegetable(id, selectedVeg);
        toast.success('Vegetable assigned');
      } else {
        await removeVegetable(id);
        toast.success('Vegetable removed');
      }
      setVegModal(false); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update vegetable'));
    } finally {
      setSavingVeg(false);
    }
  };

  // ── Devices ───────────────────────────────────────────────────────────────
  const handleAddDevice = async () => {
    if (!selectedDev) { toast.error('Select a device'); return; }
    setSavingDev(true);
    try {
      await assignDevice(id, selectedDev);
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
      await removeDevice(id, deviceId);
      toast.success('Device removed');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove device'));
    } finally {
      setSavingDev(false);
    }
  };

  // ── Stock ─────────────────────────────────────────────────────────────────
  const openStock = () => { setStockKg(unit.currentStockKg); setStockModal(true); };
  const handleSaveStock = async () => {
    if (stockKg < 0) { toast.error('Stock cannot be negative'); return; }
    setSavingStock(true);
    try {
      await updateStock(id, Number(stockKg));
      toast.success('Stock updated');
      setStockModal(false); load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update stock'));
    } finally {
      setSavingStock(false);
    }
  };

  // ── Capacity Calc ─────────────────────────────────────────────────────────
  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await calculateCapacity(id, { vegetable: calcVeg, addStockKg: calcAddKg || 0 });
      setCalcResult(getData(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Calculation failed'));
    } finally {
      setCalculating(false);
    }
  };

  const availableDevices = allDevices.filter(
    (d) => !(unit?.assignedDevices || []).some((a) => (a._id || a) === d._id)
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded-full" />
        </div>
      </div>
    );
  }

  if (!unit) return null;

  const maxKg   = unit.maxCapacityKg ?? unit.capacityTons * 1000;
  const availKg = unit.availableCapacityKg ?? (maxKg - unit.currentStockKg);
  const pct     = unit.usagePercentage ?? 0;
  const pctColor = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="space-y-5">

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/storage-units')}
          className="flex items-center gap-2 text-sm text-[#49608c] hover:text-[#2E3A8C] transition-colors"
        >
          <FiArrowLeft size={16} /> Back to Storage Units
        </button>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50">
            <FiRefreshCw size={13} />
          </button>
          {isAdmin && (
            <>
              <button onClick={openEdit} className="flex items-center gap-2 text-sm border border-gray-200 bg-white text-[#49608c] px-4 py-2 rounded-lg hover:bg-gray-50">
                <FiEdit2 size={14} /> Edit
              </button>
              <button onClick={() => setDeleteModal(true)} className="flex items-center gap-2 text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100">
                <FiTrash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiBox size={28} className="text-[#2E3A8C]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-[#2E3A8C]">{unit.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unit.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {unit.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">{unit.unitId}</div>
            {unit.location && (
              <div className="flex items-center gap-1 text-xs text-[#49608c] mt-1.5">
                <FiMapPin size={11} /> {unit.location}
              </div>
            )}
            {unit.description && (
              <p className="text-sm text-gray-500 mt-2">{unit.description}</p>
            )}
          </div>
        </div>

        {/* Capacity bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#49608c]">Capacity Usage</span>
            <span className={`text-sm font-bold ${pctColor}`}>{pct}% full</span>
          </div>
          <UsageBar pct={pct} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatBox label="Total Capacity" value={`${unit.capacityTons} Ton`} sub={`${maxKg.toLocaleString()} kg`} />
          <StatBox label="Current Stock" value={`${unit.currentStockKg.toLocaleString()} kg`} color="text-[#2E3A8C]" />
          <StatBox label="Available" value={`${availKg.toLocaleString()} kg`} color="text-green-600" />
          <StatBox label="Usage" value={`${pct}%`} color={pctColor} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100">
          <button
            onClick={openStock}
            className="flex items-center gap-2 text-sm bg-[#2E3A8C] text-white px-4 py-2 rounded-lg hover:bg-[#1e2d6e] transition-colors"
          >
            <FiZap size={14} /> Update Stock
          </button>
          <button
            onClick={() => { setCalcResult(null); setCalcAddKg(0); setCalcModal(true); }}
            className="flex items-center gap-2 text-sm border border-blue-200 text-[#2E3A8C] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FiBox size={14} /> Capacity Calculator
          </button>
          {isAdmin && (
            <button
              onClick={openVeg}
              className="flex items-center gap-2 text-sm border border-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
            >
              <MdOutlineEco size={14} />
              {unit.assignedVegetable ? 'Change Vegetable' : 'Assign Vegetable'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Vegetable */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2E3A8C] flex items-center gap-2">
              <MdOutlineEco size={18} /> Assigned Vegetable
            </h2>
            {isAdmin && (
              <button onClick={openVeg} className="text-xs text-[#2E3A8C] hover:underline">Change</button>
            )}
          </div>
          {unit.assignedVegetable ? (
            <div className="space-y-2">
              <div className="font-semibold text-[#2E3A8C]">{unit.assignedVegetable.name}</div>
              {unit.assignedVegetable.temperature && (
                <div className="grid grid-cols-2 gap-2 text-xs text-[#49608c]">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="font-medium">Temperature</div>
                    <div>{unit.assignedVegetable.temperature.min}°C – {unit.assignedVegetable.temperature.max}°C</div>
                  </div>
                  {unit.assignedVegetable.humidity && (
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="font-medium">Humidity</div>
                      <div>{unit.assignedVegetable.humidity.min}% – {unit.assignedVegetable.humidity.max}%</div>
                    </div>
                  )}
                </div>
              )}
              {unit.assignedVegetable.storageDurationDays && (
                <div className="text-xs text-gray-400">
                  Storage duration: <span className="font-medium text-[#49608c]">{unit.assignedVegetable.storageDurationDays} days</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-center py-4">
              No vegetable assigned
              {isAdmin && (
                <button onClick={openVeg} className="block mx-auto mt-2 text-xs text-[#2E3A8C] underline">Assign one</button>
              )}
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2E3A8C] flex items-center gap-2">
              <FiCpu size={16} /> Assigned Sensors
              <span className="text-xs bg-blue-100 text-[#2E3A8C] px-2 py-0.5 rounded-full font-normal">
                {(unit.assignedDevices || []).length}
              </span>
            </h2>
            {isAdmin && (
              <button onClick={() => setDevModal(true)} className="text-xs text-[#2E3A8C] hover:underline flex items-center gap-1">
                <FiPlus size={12} /> Add
              </button>
            )}
          </div>
          {(unit.assignedDevices || []).length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">No sensors assigned</div>
          ) : (
            <div className="space-y-2">
              {(unit.assignedDevices || []).map((d) => (
                <div key={d._id || d} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FiCpu size={13} className="text-[#2E3A8C]" />
                    <div>
                      <div className="text-xs font-semibold font-mono text-[#2E3A8C]">{d.deviceId || d}</div>
                      {d.name && <div className="text-xs text-gray-400">{d.name}</div>}
                    </div>
                    {d.status && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${d.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {d.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {d._id && (
                      <button
                        onClick={() => navigate(`/admin/devices/${d._id}`)}
                        className="text-xs text-[#2E3A8C] hover:underline"
                      >
                        View
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveDevice(d._id || d)}
                        disabled={savingDev}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-40"
                      >
                        <FiX size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Dialog open={editModal} onClose={() => setEditModal(false)} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Edit Storage Unit</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Name *</label>
              <input type="text" value={editForm.name || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Capacity (Tons) *</label>
              <input type="number" min={0.1} step={0.5} value={editForm.capacityTons || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, capacityTons: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Location</label>
              <input type="text" value={editForm.location || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Description</label>
              <textarea value={editForm.description || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 resize-none" />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setEditModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Update
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={deleteModal} onClose={() => setDeleteModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">Delete <strong>{unit.name}</strong>? This cannot be undone.</p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setDeleteModal(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60">
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Vegetable Modal ───────────────────────────────────────────────────── */}
      <Dialog open={vegModal} onClose={() => setVegModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Assign Vegetable</DialogTitle>
        <DialogContent>
          <select value={selectedVeg} onChange={(e) => setSelectedVeg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 mt-1">
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

      {/* ── Add Device Modal ──────────────────────────────────────────────────── */}
      <Dialog open={devModal} onClose={() => setDevModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Add Sensor</DialogTitle>
        <DialogContent>
          <select value={selectedDev} onChange={(e) => setSelectedDev(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 mt-1">
            <option value="">— Select device —</option>
            {availableDevices.map((d) => (
              <option key={d._id} value={d._id}>{d.deviceId} · {d.name}</option>
            ))}
          </select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={() => setDevModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleAddDevice} disabled={savingDev || !selectedDev}
            className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {savingDev && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Add
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Stock Modal ───────────────────────────────────────────────────────── */}
      <Dialog open={stockModal} onClose={() => setStockModal(false)} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Update Stock</DialogTitle>
        <DialogContent>
          <p className="text-xs text-gray-400 mb-3">Max capacity: {maxKg.toLocaleString()} kg</p>
          <label className="block text-sm font-medium text-[#49608c] mb-1">Current Stock (kg)</label>
          <input type="number" min={0} max={maxKg} value={stockKg}
            onChange={(e) => setStockKg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
          {Number(stockKg) >= 0 && (
            <p className="text-xs text-green-600 mt-1.5">
              Usage: {Math.round((Number(stockKg) / maxKg) * 100)}% · Available: {(maxKg - Number(stockKg)).toLocaleString()} kg
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

      {/* ── Capacity Calculator Modal ─────────────────────────────────────────── */}
      <Dialog open={calcModal} onClose={() => setCalcModal(false)} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>Capacity Calculator</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
              </div>
            </div>
            <button onClick={handleCalculate} disabled={calculating}
              className="w-full py-2.5 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center justify-center gap-2 font-medium">
              {calculating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calculating…</> : 'Calculate'}
            </button>
            {calcResult && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-gray-400">Available</div><div className="font-bold text-green-600">{calcResult.availableCapacityKg?.toLocaleString()} kg</div></div>
                  <div><div className="text-xs text-gray-400">Usage</div><div className="font-bold text-orange-600">{calcResult.usagePercentage}%</div></div>
                  <div><div className="text-xs text-gray-400">Packing Density</div><div className="font-bold text-[#49608c]">{calcResult.packingDensityKgPerM3} kg/m³</div></div>
                </div>
                {calcResult.simulation && (
                  <div className={`rounded-lg p-3 text-sm ${calcResult.simulation.canFit ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`font-semibold mb-1 ${calcResult.simulation.canFit ? 'text-green-700' : 'text-yellow-700'}`}>
                      {calcResult.simulation.canFit
                        ? `✓ ${calcAddKg.toLocaleString()} kg fits`
                        : `⚠ Only ${calcResult.simulation.canActuallyAddKg?.toLocaleString()} kg can fit`}
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

export default StorageUnitDetail;
