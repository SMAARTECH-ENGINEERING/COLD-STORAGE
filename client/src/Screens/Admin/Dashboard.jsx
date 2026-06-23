import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCpu, FiBell, FiUsers, FiThermometer, FiDroplet, FiAlertTriangle, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import { MdOutlineSensors } from 'react-icons/md';
import { getSummary, getDeviceHealth } from '../../api/dashboard.api';
import { getAlerts, acknowledgeAlert } from '../../api/alerts.api';
import { getData, getList, getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import Card from '../../Components/ui/Card';
import Badge from '../../Components/ui/Badge';
import Skeleton from '../../Components/ui/Skeleton';
import EmptyState from '../../Components/ui/EmptyState';

/* ─── lookup maps (module-level constants) ───────────────────────────────── */
const statusTone = { online: 'success', offline: 'danger', maintenance: 'warning' };
const statusDot = { online: 'bg-success-500', offline: 'bg-danger-500', maintenance: 'bg-warning-500' };
const severityTone = { low: 'info', medium: 'warning', high: 'warning', critical: 'danger' };
// Tailwind's content scanner needs literal class names — `bg-${tone}-50` would
// never be generated, so the icon-tile backgrounds are mapped explicitly.
const toneBg = {
  brand: 'bg-brand-50',
  success: 'bg-success-50',
  danger: 'bg-danger-50',
  purple: 'bg-purple-50',
};
const alertTypeLabel = {
  temperature_high: 'Temp High', temperature_low: 'Temp Low',
  humidity_high: 'Humidity High', humidity_low: 'Humidity Low',
  door_open: 'Door Open', device_offline: 'Offline', no_data: 'No Data',
};

/* ─── memoized sub-components ────────────────────────────────────────────── */
const StatCard = React.memo(({ icon, label, value, sub, tone, onClick, delay = 0 }) => (
  <Card
    interactive={Boolean(onClick)}
    onClick={onClick}
    aria-label={onClick ? `${label}: view details` : undefined}
    className="p-5 flex items-center gap-4 animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${toneBg[tone] || 'bg-gray-50'}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-2xl font-bold text-brand-600 tabular-nums">
        {value !== undefined && value !== null ? value : <span className="text-gray-300 text-xl">—</span>}
      </div>
      <div className="text-sm text-ink truncate">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5 truncate">{sub}</div>}
    </div>
    {onClick && <FiChevronRight className="text-gray-300 flex-shrink-0" size={16} />}
  </Card>
));
StatCard.displayName = 'StatCard';

const DeviceSkeleton = React.memo(() => (
  <div className="border border-gray-100 rounded-lg p-4">
    <div className="flex justify-between mb-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-3 w-16" />)}
    </div>
  </div>
));
DeviceSkeleton.displayName = 'DeviceSkeleton';

const StatCardSkeleton = React.memo(() => (
  <Card className="p-5">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  </Card>
));
StatCardSkeleton.displayName = 'StatCardSkeleton';

const AlertSkeleton = React.memo(() => (
  <div className="border border-gray-100 rounded-lg p-3 space-y-2">
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-20" />
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

  const handleAcknowledge = useCallback(async (e, alertId) => {
    e.stopPropagation();
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
      icon:  <FiCpu size={22} className="text-brand-600" />,
      label: 'Total Devices',
      value: summary?.devices?.total,
      sub:   `${summary?.devices?.online ?? 0} online`,
      tone:  'brand',
      onClick: () => navigate('/admin/devices'),
    },
    {
      icon:  <MdOutlineSensors size={22} className="text-success-600" />,
      label: 'Online',
      value: summary?.devices?.online,
      sub:   `${summary?.devices?.offline ?? 0} offline`,
      tone:  'success',
      onClick: () => navigate('/admin/devices'),
    },
    {
      icon:  <FiBell size={22} className="text-danger-500" />,
      label: 'Active Alerts',
      value: summary?.alerts?.active,
      sub:   'requires attention',
      tone:  'danger',
      onClick: () => navigate('/admin/alerts'),
    },
    ...(isAdmin
      ? [{
          icon:  <FiUsers size={22} className="text-purple-600" />,
          label: 'Total Users',
          value: summary?.users?.total,
          sub:   `${summary?.users?.active ?? 0} active`,
          tone:  'purple',
          onClick: () => navigate('/admin/users'),
        }]
      : []),
  ], [summary, isAdmin, navigate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-600 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
            </span>
            {lastUpdated ? `Live · updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-ink hover:text-brand-600 border border-gray-200 bg-white px-3.5 py-2 rounded-lg hover:bg-gray-50 hover:shadow-soft transition-all disabled:opacity-50"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 60} />)}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Device Health */}
        <Card className="xl:col-span-2 p-5 animate-slide-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-600">Device Health</h2>
            <button
              onClick={() => navigate('/admin/devices')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              View all <FiChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <DeviceSkeleton key={i} />)}</div>
          ) : devices.length === 0 ? (
            <EmptyState icon={<FiCpu size={28} />} title="No device data available" />
          ) : (
            <div className="space-y-3">
              {devices.map((d) => (
                <button
                  key={d.deviceId}
                  onClick={() => d._id && navigate(`/admin/devices/${d._id}`)}
                  className="w-full text-left border border-gray-100 rounded-lg p-4 hover:border-brand-200 hover:shadow-soft hover:bg-brand-50/30 transition-all focus-visible:shadow-focus"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[d.status] || 'bg-gray-300'}`} />
                      <span className="font-semibold text-sm text-brand-600 truncate">{d.name}</span>
                      <span className="text-xs text-gray-400 font-mono flex-shrink-0">{d.deviceId}</span>
                    </div>
                    <Badge tone={statusTone[d.status]}>{d.status}</Badge>
                  </div>

                  {d.stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiThermometer size={12} className="text-orange-500 flex-shrink-0" />
                        <span className="text-ink">
                          avg <span className="font-semibold text-brand-600">{d.stats.avgTemp?.toFixed(1)}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiThermometer size={12} className="text-red-400 flex-shrink-0" />
                        <span className="text-ink">
                          max <span className="font-semibold text-red-600">{d.stats.maxTemp?.toFixed(1)}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiDroplet size={12} className="text-blue-500 flex-shrink-0" />
                        <span className="text-ink">
                          avg <span className="font-semibold text-brand-600">{d.stats.avgHumidity?.toFixed(0)}%</span>
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
                      <Badge tone="success">{d.assignedVegetable.name}</Badge>
                      {d.assignedVegetable.temperature && (
                        <span className="text-xs text-gray-400">
                          Target: {d.assignedVegetable.temperature.min}–{d.assignedVegetable.temperature.max}°C
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Active Alerts */}
        <Card className="p-5 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-600">Active Alerts</h2>
            <button
              onClick={() => navigate('/admin/alerts')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              View all <FiChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <AlertSkeleton key={i} />)}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState icon={<FiAlertTriangle size={28} />} title="No active alerts" description="You're all caught up." />
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <button
                  key={alert._id}
                  onClick={() => navigate('/admin/alerts')}
                  className="w-full text-left border border-gray-100 rounded-lg p-3 hover:border-orange-200 hover:shadow-soft transition-all focus-visible:shadow-focus"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge tone={severityTone[alert.severity]} className="px-1.5">{alert.severity}</Badge>
                    <span className="text-xs text-gray-400">
                      {alertTypeLabel[alert.alertType] || alert.alertType}
                    </span>
                  </div>
                  <p className="text-xs text-ink line-clamp-2">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400 font-mono">{alert.deviceId}</span>
                    {alert.status === 'active' && (
                      <span
                        onClick={(e) => handleAcknowledge(e, alert._id)}
                        className="text-xs text-brand-600 hover:text-brand-700 hover:underline font-medium"
                      >
                        Ack
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
