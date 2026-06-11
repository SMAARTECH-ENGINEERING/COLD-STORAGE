import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCpu, FiBell, FiUsers, FiThermometer, FiDroplet, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { MdOutlineSensors } from 'react-icons/md';
import { getSummary, getDeviceHealth } from '../../api/dashboard.api';
import { getAlerts, acknowledgeAlert } from '../../api/alerts.api';
import { getData, getList, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';

/* ─── lookup maps (module-level constants) ───────────────────────────────── */
const statusColor = {
  online:      'bg-green-100 text-green-700',
  offline:     'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
};
const severityColor = {
  low:      'bg-blue-100 text-blue-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
const alertTypeLabel = {
  temperature_high: 'Temp High', temperature_low: 'Temp Low',
  humidity_high: 'Humidity High', humidity_low: 'Humidity Low',
  door_open: 'Door Open', device_offline: 'Offline', no_data: 'No Data',
};

/* ─── memoized sub-components ────────────────────────────────────────────── */
const StatCard = React.memo(({ icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-[#2E3A8C]">
        {value !== undefined && value !== null ? value : <span className="text-gray-300 text-xl">—</span>}
      </div>
      <div className="text-sm text-[#49608c]">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

const DeviceSkeleton = React.memo(() => (
  <div className="border border-gray-100 rounded-lg p-4 animate-pulse">
    <div className="flex justify-between mb-2">
      <div className="h-4 bg-gray-100 rounded w-32" />
      <div className="h-4 bg-gray-100 rounded w-16" />
    </div>
    <div className="grid grid-cols-3 gap-2 mt-2">
      {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-100 rounded w-16" />)}
    </div>
  </div>
));
DeviceSkeleton.displayName = 'DeviceSkeleton';

const StatCardSkeleton = React.memo(() => (
  <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-100 rounded-xl" />
      <div className="space-y-2">
        <div className="h-6 w-12 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
));
StatCardSkeleton.displayName = 'StatCardSkeleton';

const AlertSkeleton = React.memo(() => (
  <div className="border border-gray-100 rounded-lg p-3 animate-pulse">
    <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
    <div className="h-3 bg-gray-100 rounded w-20" />
  </div>
));
AlertSkeleton.displayName = 'AlertSkeleton';

/* ─── main component ─────────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [summary, setSummary]   = useState(null);
  const [devices, setDevices]   = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const [summaryRes, healthRes, alertsRes] = await Promise.all([
        getSummary(),
        getDeviceHealth(),
        getAlerts({ status: 'active', limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setSummary(getData(summaryRes));
      setDevices(getList(healthRes));
      setAlerts(getList(alertsRes));
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const socketHandlers = useMemo(() => ({
    'dashboard:update':   () => load(true),
    'alert:new':          () => load(true),
    'alert:resolved':     () => load(true),
    'alert:acknowledged': () => load(true),
  }), [load]);

  useSocket(socketHandlers);

  const handleAcknowledge = useCallback(async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      load(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to acknowledge alert'));
    }
  }, [load]);

  const stats = useMemo(() => [
    {
      icon:  <FiCpu size={22} className="text-[#2E3A8C]" />,
      label: 'Total Devices',
      value: summary?.devices?.total,
      sub:   `${summary?.devices?.online ?? 0} online`,
      color: 'bg-blue-50',
    },
    {
      icon:  <MdOutlineSensors size={22} className="text-green-600" />,
      label: 'Online',
      value: summary?.devices?.online,
      sub:   `${summary?.devices?.offline ?? 0} offline`,
      color: 'bg-green-50',
    },
    {
      icon:  <FiBell size={22} className="text-red-500" />,
      label: 'Active Alerts',
      value: summary?.alerts?.active,
      sub:   'requires attention',
      color: 'bg-red-50',
    },
    ...(isAdmin
      ? [{
          icon:  <FiUsers size={22} className="text-purple-600" />,
          label: 'Total Users',
          value: summary?.users?.total,
          sub:   `${summary?.users?.active ?? 0} active`,
          color: 'bg-purple-50',
        }]
      : []),
  ], [summary, isAdmin]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#2E3A8C]">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#49608c] hover:text-[#2E3A8C] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Device Health */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2E3A8C]">Device Health</h2>
            <button onClick={() => navigate('/admin/devices')} className="text-xs text-[#2E3A8C] hover:underline">
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <DeviceSkeleton key={i} />)}</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No device data available</div>
          ) : (
            <div className="space-y-3">
              {devices.map((d) => (
                <div key={d.deviceId} className="border border-gray-100 rounded-lg p-4 hover:border-[#2E3A8C]/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#2E3A8C]">{d.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{d.deviceId}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>
                      {d.status}
                    </span>
                  </div>

                  {d.stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiThermometer size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-[#49608c]">
                          avg <span className="font-semibold text-[#2E3A8C]">{d.stats.avgTemp?.toFixed(1)}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiThermometer size={12} className="text-red-400 flex-shrink-0" />
                        <span className="text-[#49608c]">
                          max <span className="font-semibold text-red-600">{d.stats.maxTemp?.toFixed(1)}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiDroplet size={12} className="text-blue-500 flex-shrink-0" />
                        <span className="text-[#49608c]">
                          avg <span className="font-semibold text-[#2E3A8C]">{d.stats.avgHumidity?.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {d.stats.readingsCount} readings
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">No sensor data yet</div>
                  )}

                  {d.assignedVegetable && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                        {d.assignedVegetable.name}
                      </span>
                      {d.assignedVegetable.temperature && (
                        <span className="text-xs text-gray-400">
                          Target: {d.assignedVegetable.temperature.min}–{d.assignedVegetable.temperature.max}°C
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#2E3A8C]">Active Alerts</h2>
            <button onClick={() => navigate('/admin/alerts')} className="text-xs text-[#2E3A8C] hover:underline">
              View all →
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <AlertSkeleton key={i} />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
              <FiAlertTriangle size={28} className="text-gray-300" />
              <span className="text-sm">No active alerts</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <div key={alert._id} className="border border-gray-100 rounded-lg p-3 hover:border-orange-200 transition-colors">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${severityColor[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-400">
                      {alertTypeLabel[alert.alertType] || alert.alertType}
                    </span>
                  </div>
                  <p className="text-xs text-[#49608c] line-clamp-2">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400 font-mono">{alert.deviceId}</span>
                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="text-xs text-[#2E3A8C] hover:underline font-medium"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
