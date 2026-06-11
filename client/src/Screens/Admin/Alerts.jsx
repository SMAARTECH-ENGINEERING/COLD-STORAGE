import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiTrash2, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { MdOutlineDoneAll } from 'react-icons/md';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getAlerts, acknowledgeAlert, resolveAlert, deleteAlert } from '../../api/alerts.api';
import { getList, getPagination, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

const severityColor = {
  low:      'bg-blue-100 text-blue-700 border-blue-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};
const statusColor = {
  active:       'bg-red-100 text-red-700',
  acknowledged: 'bg-yellow-100 text-yellow-700',
  resolved:     'bg-green-100 text-green-700',
};
const alertTypeLabel = {
  temperature_high: 'Temp High', temperature_low: 'Temp Low',
  humidity_high: 'Humidity High', humidity_low: 'Humidity Low',
  door_open: 'Door Open', device_offline: 'Offline', no_data: 'No Data',
};

const STATUSES   = ['active', 'acknowledged', 'resolved'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const TYPES      = Object.keys(alertTypeLabel);
const DIALOG_PAPER = { sx: { borderRadius: '12px' } };

const RowSkeleton = React.memo(() => (
  <tr>
    {Array(7).fill(0).map((_, i) => (
      <td key={i} className="px-5 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
    ))}
  </tr>
));
RowSkeleton.displayName = 'RowSkeleton';

const Alerts = () => {
  const { isAdmin } = useAuth();

  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 15;

  const [statusFilter,   setStatusFilter]   = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter,     setTypeFilter]     = useState('');
  const [search,         setSearch]         = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const searchTimer = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {
        page, limit,
        ...(statusFilter   && { status:    statusFilter }),
        ...(severityFilter && { severity:  severityFilter }),
        ...(typeFilter     && { alertType: typeFilter }),
        sortBy: 'createdAt', sortOrder: 'desc',
      };
      const res = await getAlerts(params);
      setAlerts(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Failed to load alerts'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const socketHandlers = useMemo(() => ({
    'alert:new':          () => load(true),
    'alert:acknowledged': () => load(true),
    'alert:resolved':     () => load(true),
  }), [load]);

  useSocket(socketHandlers);

  const handleSearchChange = useCallback((e) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(e.target.value), 300);
  }, []);

  const handleAcknowledge = useCallback(async (id) => {
    setActionLoading((p) => ({ ...p, [id]: 'ack' }));
    try {
      await acknowledgeAlert(id);
      toast.success('Alert acknowledged');
      load(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to acknowledge'));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  }, [load]);

  const handleResolve = useCallback(async (id) => {
    setActionLoading((p) => ({ ...p, [id]: 'resolve' }));
    try {
      await resolveAlert(id);
      toast.success('Alert resolved');
      load(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to resolve'));
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }));
    }
  }, [load]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteAlert(deleteTarget._id);
      toast.success('Alert deleted');
      setDeleteTarget(null);
      load(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete'));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, load]);

  const resetFilters = useCallback(() => {
    setStatusFilter('');
    setSeverityFilter('');
    setTypeFilter('');
    setSearch('');
    setPage(1);
  }, []);

  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const hasFilters = statusFilter || severityFilter || typeFilter || search;

  const filtered = useMemo(() =>
    search
      ? alerts.filter((a) =>
          a.message?.toLowerCase().includes(search.toLowerCase()) ||
          a.deviceId?.toLowerCase().includes(search.toLowerCase())
        )
      : alerts,
    [alerts, search]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Alerts</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} total alerts</p>
        </div>
        <button onClick={() => load()} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-44">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Search message or device…" onChange={handleSearchChange}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30" />
        </div>
        {[
          { value: statusFilter,   setter: setStatusFilter,   options: STATUSES,   label: 'All Statuses' },
          { value: severityFilter, setter: setSeverityFilter, options: SEVERITIES, label: 'All Severities' },
          { value: typeFilter,     setter: setTypeFilter,     options: TYPES,      label: 'All Types', labelFn: (t) => alertTypeLabel[t] },
        ].map(({ value, setter, options, label, labelFn }) => (
          <select key={label} value={value} onChange={(e) => { setter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30">
            <option value="">{label}</option>
            {options.map((o) => <option key={o} value={o}>{labelFn ? labelFn(o) : o}</option>)}
          </select>
        ))}
        {hasFilters && (
          <button onClick={resetFilters} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 bg-red-50 rounded-lg">
            Clear
          </button>
        )}
      </div>

      {/* Status quick-filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s === statusFilter ? '' : s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors ${
              statusFilter === s
                ? 'bg-[#2E3A8C] text-white border-[#2E3A8C]'
                : 'bg-white text-[#49608c] border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f2f6fc] text-[#49608c] text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Type</th>
                <th className="text-left px-5 py-3 font-semibold">Device</th>
                <th className="text-left px-5 py-3 font-semibold">Severity</th>
                <th className="text-left px-5 py-3 font-semibold w-64">Message</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Time</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array(6).fill(0).map((_, i) => <RowSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <FiAlertTriangle size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">No alerts found</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((alert) => (
                    <tr key={alert._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium text-[#49608c] bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                          {alertTypeLabel[alert.alertType] || alert.alertType}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs font-mono text-[#2E3A8C]">{alert.deviceId}</div>
                        {alert.device?.name && (
                          <div className="text-xs text-gray-400">{alert.device.name}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border capitalize ${severityColor[alert.severity] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#49608c] max-w-xs">
                        <span className="line-clamp-2">{alert.message}</span>
                        {alert.value != null && (
                          <span className="text-gray-400 block mt-0.5">
                            Value: {alert.value}{alert.threshold != null ? ` / Limit: ${alert.threshold}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[alert.status]}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-[#49608c] whitespace-nowrap">
                        {new Date(alert.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {alert.status === 'active' && (
                            <button onClick={() => handleAcknowledge(alert._id)} disabled={actionLoading[alert._id] === 'ack'} title="Acknowledge"
                              className="p-1.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-40">
                              {actionLoading[alert._id] === 'ack'
                                ? <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                : <FiCheckCircle size={15} />}
                            </button>
                          )}
                          {(alert.status === 'active' || alert.status === 'acknowledged') && (
                            <button onClick={() => handleResolve(alert._id)} disabled={actionLoading[alert._id] === 'resolve'} title="Resolve"
                              className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40">
                              {actionLoading[alert._id] === 'resolve'
                                ? <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                : <MdOutlineDoneAll size={16} />}
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={() => setDeleteTarget(alert)} title="Delete"
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              Page {page} of {pagination.totalPages} · {pagination.total} alerts
            </span>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Prev</button>
              <button disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 bg-white">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteTarget)} onClose={closeDelete} maxWidth="xs" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C' }}>Delete Alert</DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#49608c]">Permanently delete this alert? This cannot be undone.</p>
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

export default Alerts;
