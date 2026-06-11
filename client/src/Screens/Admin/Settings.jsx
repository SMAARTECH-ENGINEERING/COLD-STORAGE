import React, { useEffect, useState, useCallback } from 'react';
import { FiServer, FiWifi, FiWifiOff, FiInfo, FiRefreshCw, FiShield } from 'react-icons/fi';
import { MdOutlineStorefront } from 'react-icons/md';
import axios from 'axios';
import { getServerBaseUrl } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const STATUS = { checking: 'checking', online: 'online', offline: 'offline' };

const InfoRow = React.memo(({ label, value }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-[#49608c]">{label}</span>
    <span className="text-sm font-medium text-[#2E3A8C] capitalize truncate max-w-xs text-right">
      {value ?? '—'}
    </span>
  </div>
));
InfoRow.displayName = 'InfoRow';

const RETENTION_ROWS = [
  { label: 'Sensor Readings TTL',   value: '90 days (auto-purged)' },
  { label: 'Audit Logs TTL',         value: '1 year (auto-purged)' },
  { label: 'Access Token Lifetime',  value: 'Auto-refreshed on expiry' },
  { label: 'Alert Badge Refresh',    value: 'Every 60 s + real-time via Socket.IO' },
  { label: 'Dashboard Auto-refresh', value: 'Real-time via Socket.IO' },
];

const ROLE_ROWS = [
  { role: 'Super Admin', color: 'bg-purple-100 text-purple-700', desc: 'Full system access including user management and audit logs' },
  { role: 'Admin',       color: 'bg-blue-100 text-blue-700',     desc: 'Manage users, devices, vegetables and alerts' },
  { role: 'Operator',    color: 'bg-green-100 text-green-700',   desc: 'Ingest sensor data, acknowledge alerts for assigned devices' },
  { role: 'Viewer',      color: 'bg-gray-100 text-gray-600',     desc: 'Read-only access to assigned devices and their alerts' },
];

const Settings = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState(STATUS.checking);
  const [serverInfo, setServerInfo] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkApi = useCallback(async () => {
    setChecking(true);
    setApiStatus(STATUS.checking);
    try {
      const res = await axios.get(`${getServerBaseUrl()}/health`, { timeout: 8000 });
      setApiStatus(STATUS.online);
      setServerInfo(res.data);
    } catch {
      setApiStatus(STATUS.offline);
      setServerInfo(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { checkApi(); }, [checkApi]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#2E3A8C]">Settings</h1>
        <p className="text-sm text-[#49608c]">System configuration and status</p>
      </div>

      {/* API / Backend Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiServer size={18} className="text-[#2E3A8C]" />
            <h3 className="font-semibold text-[#2E3A8C]">Backend Connection</h3>
          </div>
          <button onClick={checkApi} disabled={checking}
            className="flex items-center gap-1.5 text-xs text-[#49608c] hover:text-[#2E3A8C] border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <FiRefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Check
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg border">
          {apiStatus === STATUS.checking && (
            <>
              <div className="w-5 h-5 border-2 border-[#2E3A8C] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm text-[#49608c]">Checking connection…</span>
            </>
          )}
          {apiStatus === STATUS.online && (
            <>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
              <FiWifi size={18} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700">Connected</p>
                {serverInfo?.service && (
                  <p className="text-xs text-gray-400">{serverInfo.service} · v{serverInfo.version}</p>
                )}
              </div>
            </>
          )}
          {apiStatus === STATUS.offline && (
            <>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0" />
              <FiWifiOff size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-600">Offline</p>
                <p className="text-xs text-gray-400">Cannot reach {getServerBaseUrl()}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiInfo size={18} className="text-[#2E3A8C]" />
          <h3 className="font-semibold text-[#2E3A8C]">System Information</h3>
        </div>
        <InfoRow label="API URL"      value={process.env.REACT_APP_API_URL} />
        <InfoRow label="Server Base"  value={getServerBaseUrl()} />
        <InfoRow label="App Version"  value="1.0.0" />
        <InfoRow label="Environment"  value={process.env.NODE_ENV} />
        <InfoRow label="Logged in as" value={user?.email} />
        <InfoRow label="Role"         value={user?.role?.displayName || user?.role?.name} />
        {serverInfo?.uptime && (
          <InfoRow label="Server Uptime" value={`${Math.floor(serverInfo.uptime / 60)} min`} />
        )}
      </div>

      {/* Data Retention */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MdOutlineStorefront size={18} className="text-[#2E3A8C]" />
          <h3 className="font-semibold text-[#2E3A8C]">Data Retention Policies</h3>
        </div>
        {RETENTION_ROWS.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <span className="text-sm text-[#49608c]">{label}</span>
            <span className="text-sm font-medium text-[#2E3A8C] text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Role Reference */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiShield size={18} className="text-[#2E3A8C]" />
          <h3 className="font-semibold text-[#2E3A8C]">Role Reference</h3>
        </div>
        <div className="space-y-2">
          {ROLE_ROWS.map(({ role, color, desc }) => (
            <div key={role} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${color}`}>{role}</span>
              <span className="text-xs text-[#49608c]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
