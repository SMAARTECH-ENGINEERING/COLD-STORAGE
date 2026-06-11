import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiThermometer, FiDroplet, FiRefreshCw } from 'react-icons/fi';
import { MdOutlineEco } from 'react-icons/md';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getVegetables, createVegetable, updateVegetable, deleteVegetable } from '../../api/vegetables.api';
import { getList, getPagination, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '', description: '',
  temperature: { min: 0, max: 10 },
  humidity:    { min: 80, max: 95 },
  storageDurationDays: 30,
};
const DIALOG_PAPER = { sx: { borderRadius: '12px' } };

const CardSkeleton = React.memo(() => (
  <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 bg-gray-100 rounded-xl" />
      <div className="space-y-1.5">
        <div className="h-4 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="space-y-1.5">
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-3/4 bg-gray-100 rounded" />
    </div>
  </div>
));
CardSkeleton.displayName = 'CardSkeleton';

const RangeField = React.memo(({ label, unit, rangeKey, form, setForm, min, max }) => (
  <div>
    <label className="block text-sm font-medium text-[#49608c] mb-2">{label} ({unit})</label>
    <div className="grid grid-cols-2 gap-2">
      {['min', 'max'].map((bound) => (
        <div key={bound}>
          <span className="text-xs text-gray-400 block mb-1 capitalize">{bound}</span>
          <input
            type="number" min={min} max={max}
            value={form[rangeKey][bound]}
            onChange={(e) => setForm((f) => ({ ...f, [rangeKey]: { ...f[rangeKey], [bound]: Number(e.target.value) } }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
        </div>
      ))}
    </div>
  </div>
));
RangeField.displayName = 'RangeField';

const Vegetables = () => {
  const { isAdmin } = useAuth();

  const [vegetables, setVegetables] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 12;

  const [modalOpen, setModalOpen]   = useState(false);
  const [editVeg, setEditVeg]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVegetables({ page, limit, ...(search && { search }) });
      setVegetables(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load vegetables'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = useCallback((e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(e.target.value); setPage(1); }, 400);
  }, []);

  const openCreate = useCallback(() => {
    setEditVeg(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((v) => {
    setEditVeg(v);
    setForm({
      name: v.name,
      description: v.description || '',
      temperature: { min: v.temperature?.min ?? 0,  max: v.temperature?.max ?? 10 },
      humidity:    { min: v.humidity?.min    ?? 80, max: v.humidity?.max    ?? 95 },
      storageDurationDays: v.storageDurationDays || 30,
    });
    setModalOpen(true);
  }, []);

  const closeModal  = useCallback(() => setModalOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.temperature.min >= form.temperature.max) { toast.error('Temp min must be less than max'); return; }
    if (form.humidity.min >= form.humidity.max) { toast.error('Humidity min must be less than max'); return; }
    setSaving(true);
    try {
      if (editVeg) {
        await updateVegetable(editVeg._id, form);
        toast.success('Updated successfully');
      } else {
        await createVegetable(form);
        toast.success('Vegetable profile created');
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
      await deleteVegetable(deleteTarget._id);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Fruits & Vegetables</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} storage profiles</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-[#2E3A8C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] transition-colors">
              <FiPlus size={16} /> Add Profile
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Search vegetables…" onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : vegetables.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <MdOutlineEco size={40} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No storage profiles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vegetables.map((v) => (
            <div key={v._id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                    <MdOutlineEco size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#2E3A8C] text-sm">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.storageDurationDays}d storage</div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(v)} className="p-1 text-gray-400 hover:text-[#2E3A8C] rounded">
                      <FiEdit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(v)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {v.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{v.description}</p>
              )}

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <FiThermometer size={12} className="text-orange-400 flex-shrink-0" />
                  <span className="text-[#49608c]">
                    <span className="font-medium">{v.temperature?.min}°C</span>
                    <span className="text-gray-300 mx-1">→</span>
                    <span className="font-medium">{v.temperature?.max}°C</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <FiDroplet size={12} className="text-blue-400 flex-shrink-0" />
                  <span className="text-[#49608c]">
                    <span className="font-medium">{v.humidity?.min}%</span>
                    <span className="text-gray-300 mx-1">→</span>
                    <span className="font-medium">{v.humidity?.max}%</span>
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {v.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Prev</button>
          <span className="text-sm text-gray-400">Page {page} of {pagination.totalPages}</span>
          <button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Next</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          {editVeg ? 'Edit Profile' : 'Add Vegetable Profile'}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Name *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Potato"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Storage requirements…" rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30 resize-none" />
            </div>
            <RangeField label="Temperature" unit="°C" rangeKey="temperature" form={form} setForm={setForm} min={-20} max={50} />
            <RangeField label="Humidity"    unit="%" rangeKey="humidity"    form={form} setForm={setForm} min={0}   max={100} />
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Storage Duration (days)</label>
              <input type="number" min={1} value={form.storageDurationDays}
                onChange={(e) => setForm((f) => ({ ...f, storageDurationDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <button onClick={closeModal} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-[#2E3A8C] text-white rounded-lg hover:bg-[#1e2d6e] disabled:opacity-60 flex items-center gap-2">
            {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editVeg ? 'Update' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">Delete <strong>{deleteTarget?.name}</strong> profile? Assigned devices won't be affected.</p>
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

export default Vegetables;
