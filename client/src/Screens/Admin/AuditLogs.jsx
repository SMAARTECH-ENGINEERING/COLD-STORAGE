import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import { FiSearch, FiRefreshCw, FiEye, FiX } from 'react-icons/fi';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getAuditLogs, getAuditLog } from '../../api/auditLogs.api';
import { getList, getPagination, getData, getErrorMessage } from '../../utils/api.utils';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE', 'ASSIGN_DEVICES',
  'REMOVE_DEVICES', 'ACKNOWLEDGE', 'RESOLVE', 'LOGIN', 'LOGOUT'];
const RESOURCES = ['users', 'devices', 'vegetables', 'storage_units', 'sensors', 'alerts', 'auth'];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const actionColor = {
  CREATE:         'bg-green-100 text-green-700',
  UPDATE:         'bg-blue-100 text-blue-700',
  DELETE:         'bg-red-100 text-red-700',
  ACTIVATE:       'bg-emerald-100 text-emerald-700',
  DEACTIVATE:     'bg-orange-100 text-orange-700',
  ASSIGN_DEVICES: 'bg-indigo-100 text-indigo-700',
  REMOVE_DEVICES: 'bg-pink-100 text-pink-700',
  ACKNOWLEDGE:    'bg-yellow-100 text-yellow-700',
  RESOLVE:        'bg-teal-100 text-teal-700',
  LOGIN:          'bg-cyan-100 text-cyan-700',
  LOGOUT:         'bg-gray-100 text-gray-600',
};

const methodColor = {
  GET:    'bg-sky-100 text-sky-700',
  POST:   'bg-green-100 text-green-700',
  PUT:    'bg-amber-100 text-amber-700',
  PATCH:  'bg-purple-100 text-purple-700',
  DELETE: 'bg-red-100 text-red-700',
};

const statusColor = (code) => {
  if (!code) return 'bg-gray-100 text-gray-500';
  if (code < 300) return 'bg-green-100 text-green-700';
  if (code < 400) return 'bg-blue-100 text-blue-700';
  if (code < 500) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const tableCustomStyles = {
  tableWrapper: { style: { borderRadius: '12px', overflow: 'hidden' } },
  headRow: {
    style: { backgroundColor: '#f2f6fc', borderBottomWidth: '0', minHeight: '40px' },
  },
  headCells: {
    style: {
      color: '#49608c', fontSize: '11px', fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: '0.05em',
      paddingLeft: '20px', paddingRight: '20px',
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
    {Array(8).fill(0).map((_, i) => (
      <div key={i} className="flex gap-4 px-5 py-3.5">
        {Array(7).fill(0).map((__, j) => (
          <div key={j} className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
        ))}
      </div>
    ))}
  </div>
);

const NoDataComponent = () => (
  <div className="py-12 text-center text-gray-400 text-sm">No audit logs found</div>
);

const DIALOG_PAPER = { sx: { borderRadius: '12px', maxHeight: '80vh' } };

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
    <span className="text-sm text-[#2E3A8C] break-all">{value ?? '—'}</span>
  </div>
);

const AuditLogs = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [actionFilter, setAction] = useState('');
  const [resourceFilter, setRes]  = useState('');
  const [methodFilter, setMethod] = useState('');
  const [startDate, setStart]     = useState('');
  const [endDate, setEnd]         = useState('');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const limit = 20;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLog, setDetailLog]   = useState(null);
  const [detailLoading, setDL]      = useState(false);

  const searchTimer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit,
        ...(search         && { search }),
        ...(actionFilter   && { action: actionFilter }),
        ...(resourceFilter && { resource: resourceFilter }),
        ...(methodFilter   && { method: methodFilter }),
        ...(startDate      && { startDate }),
        ...(endDate        && { endDate }),
      };
      const res = await getAuditLogs(params);
      setLogs(getList(res));
      setPagination(getPagination(res));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, resourceFilter, methodFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleSearchChange = useCallback((e) => {
    clearTimeout(searchTimer.current);
    const val = e.target.value;
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  }, []);

  const openDetail = useCallback(async (log) => {
    setDetailLog(log);
    setDetailOpen(true);
    setDL(true);
    try {
      const res = await getAuditLog(log._id);
      setDetailLog(getData(res));
    } catch {
      toast.error('Failed to load log details');
    } finally {
      setDL(false);
    }
  }, []);

  const closeDetail = useCallback(() => setDetailOpen(false), []);

  const columns = useMemo(() => [
    {
      name: 'Timestamp',
      minWidth: '140px',
      cell: (l) => (
        <div className="py-1">
          <div className="text-xs font-medium text-[#2E3A8C]">
            {new Date(l.createdAt).toLocaleDateString()}
          </div>
          <div className="text-[11px] text-gray-400">
            {new Date(l.createdAt).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      name: 'User',
      minWidth: '160px',
      cell: (l) => (
        <div className="py-1">
          <div className="text-xs font-medium text-[#2E3A8C] truncate max-w-[140px]">
            {l.user?.name || '—'}
          </div>
          <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
            {l.userEmail || '—'}
          </div>
        </div>
      ),
    },
    {
      name: 'Action',
      minWidth: '120px',
      cell: (l) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor[l.action] || 'bg-gray-100 text-gray-600'}`}>
          {l.action}
        </span>
      ),
    },
    {
      name: 'Resource',
      minWidth: '110px',
      cell: (l) => (
        <span className="text-xs text-[#49608c] font-mono bg-gray-50 px-2 py-0.5 rounded capitalize">
          {l.resource?.replace('_', ' ')}
        </span>
      ),
    },
    {
      name: 'Description',
      minWidth: '200px',
      cell: (l) => (
        <span className="text-xs text-[#49608c] line-clamp-2">{l.description || '—'}</span>
      ),
    },
    {
      name: 'Method',
      minWidth: '80px',
      cell: (l) => l.method ? (
        <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${methodColor[l.method] || 'bg-gray-100 text-gray-600'}`}>
          {l.method}
        </span>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      name: 'Status',
      minWidth: '70px',
      cell: (l) => l.statusCode ? (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(l.statusCode)}`}>
          {l.statusCode}
        </span>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      name: '',
      right: true,
      minWidth: '50px',
      cell: (l) => (
        <button
          onClick={() => openDetail(l)}
          className="p-1.5 text-[#49608c] hover:text-[#2E3A8C] hover:bg-blue-50 rounded-lg transition-colors"
          title="View details"
        >
          <FiEye size={15} />
        </button>
      ),
    },
  ], [openDetail]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Audit Logs</h1>
          <p className="text-sm text-[#49608c]">{pagination.total} total records</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search email, description, path…"
              onChange={handleSearchChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => { setRes(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          >
            <option value="">All Resources</option>
            {RESOURCES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          >
            <option value="">All Methods</option>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-xs text-gray-400 font-medium">Date range:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStart(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
          <span className="text-gray-300 text-sm">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEnd(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStart(''); setEnd(''); setPage(1); }}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <FiX size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm">
        <DataTable
          columns={columns}
          data={logs}
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

      {/* Detail Modal */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="sm" fullWidth PaperProps={DIALOG_PAPER}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2E3A8C', fontSize: 18 }}>
          Log Detail
          {detailLog && (
            <span className="block text-xs font-normal text-gray-400 mt-0.5 font-mono">{detailLog._id}</span>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-[#49608c]">
              <div className="w-5 h-5 border-2 border-[#2E3A8C] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : detailLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Timestamp" value={new Date(detailLog.createdAt).toLocaleString()} />
                <DetailRow label="User" value={detailLog.user?.name || detailLog.userEmail} />
                <DetailRow label="Email" value={detailLog.userEmail} />
                <DetailRow label="IP Address" value={detailLog.ipAddress} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Action</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block w-fit ${actionColor[detailLog.action] || 'bg-gray-100 text-gray-600'}`}>
                    {detailLog.action}
                  </span>
                </div>
                <DetailRow label="Resource" value={detailLog.resource?.replace('_', ' ')} />
                <DetailRow label="Resource ID" value={detailLog.resourceId} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block w-fit ${statusColor(detailLog.statusCode)}`}>
                    {detailLog.statusCode || '—'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Method</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold inline-block w-fit ${methodColor[detailLog.method] || 'bg-gray-100 text-gray-600'}`}>
                    {detailLog.method || '—'}
                  </span>
                </div>
                <DetailRow label="Path" value={detailLog.path} />
              </div>
              {detailLog.description && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Description</span>
                  <p className="text-sm text-[#49608c] mt-1">{detailLog.description}</p>
                </div>
              )}
              {detailLog.changes && Object.keys(detailLog.changes).length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Changes</span>
                  <pre className="mt-1 text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-48 text-[#49608c]">
                    {JSON.stringify(detailLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              {detailLog.userAgent && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">User Agent</span>
                  <p className="text-xs text-gray-400 mt-1 break-all">{detailLog.userAgent}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <button onClick={closeDetail} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
