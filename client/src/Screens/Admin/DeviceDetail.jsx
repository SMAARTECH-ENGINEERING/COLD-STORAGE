import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiThermometer, FiDroplet, FiArrowLeft, FiRefreshCw,
  FiCpu, FiAlertTriangle, FiClock, FiMapPin, FiWind, FiZap, FiDownload,
} from 'react-icons/fi';
import { MdDoorFront } from 'react-icons/md';
import { getDevice } from '../../api/devices.api';
import { getSensorHistory, getSensorStats, getLatestReading, exportSensorHistory } from '../../api/sensors.api';
import { getAlerts } from '../../api/alerts.api';
import { getData, getList, getErrorMessage } from '../../utils/api.utils';
import useSocket, { emitSocketEvent } from '../../hooks/useSocket';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmtTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const fmtDateTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TIME_RANGES = [
  { label: '6h',  hours: 6 },
  { label: '12h', hours: 12 },
  { label: '24h', hours: 24 },
  { label: '48h', hours: 48 },
  { label: '7d',  hours: 168 },
];

// VOC index thresholds (SGP40 scale: 1-500, 100 = clean air baseline)
const vocQuality = (voc) => {
  if (voc == null || voc === 0) return { label: '—',        cls: 'text-gray-400' };
  if (voc <= 100)               return { label: 'Excellent', cls: 'text-green-600' };
  if (voc <= 200)               return { label: 'Good',      cls: 'text-lime-600' };
  if (voc <= 300)               return { label: 'Moderate',  cls: 'text-yellow-600' };
  if (voc <= 400)               return { label: 'Poor',      cls: 'text-orange-600' };
  return                               { label: 'Very Poor', cls: 'text-red-600' };
};

const STATUS_COLOR = {
  online:      'bg-green-100 text-green-700',
  offline:     'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
};

const SEVERITY_COLOR = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high:     'bg-orange-50 border-orange-200 text-orange-700',
  medium:   'bg-yellow-50 border-yellow-200 text-yellow-700',
  low:      'bg-blue-50 border-blue-200 text-blue-700',
};

/* ─── custom chart tooltip ───────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs">
      <p className="text-gray-400 mb-1.5">{fmtDateTime(label)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: p.color }} className="font-medium">
            {p.name === 'Temp' ? `${p.value?.toFixed(1)}°C` : `${p.value?.toFixed(0)}%`}
          </span>
          <span className="text-gray-400">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── skeleton ───────────────────────────────────────────────────────────── */
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-lg" />
      <div className="space-y-1.5">
        <div className="h-5 w-48 bg-gray-100 rounded" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-5 w-16 bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl shadow-sm h-64" />
  </div>
);

/* ─── main component ─────────────────────────────────────────────────────── */
const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice]           = useState(null);
  const [chartData, setChartData]     = useState([]);
  const [stats, setStats]             = useState(null);
  const [liveReading, setLiveReading] = useState(null);
  const [alerts, setAlerts]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [timeRange, setTimeRange]     = useState(24);
  const loadingRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setLoading(true);
    try {
      const devRes = await getDevice(id);
      const dev = getData(devRes);
      if (!dev) throw new Error('Device not found');
      setDevice(dev);

      const startDate = new Date(Date.now() - timeRange * 3_600_000).toISOString();

      const [histRes, statsRes, latestRes, alertsRes] = await Promise.all([
        getSensorHistory(dev.deviceId, { limit: 300, startDate }),
        getSensorStats(dev.deviceId, timeRange),
        getLatestReading(dev.deviceId),
        getAlerts({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc', ...(dev.deviceId && { deviceId: dev.deviceId }) }),
      ]);

      // Sort oldest → newest for chart
      const raw = getList(histRes);
      const sorted = [...raw].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setChartData(sorted.map((r) => ({
        ts: r.timestamp,
        Temp: r.temperature != null ? +r.temperature.toFixed(2) : null,
        Humidity: r.humidity != null ? +r.humidity.toFixed(1) : null,
        door: r.doorStatus,
      })));

      setStats(getData(statsRes));

      const latest = getData(latestRes);
      if (latest) setLiveReading(latest);

      setAlerts(getList(alertsRes));
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Failed to load device data'));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [id, timeRange]);

  useEffect(() => { load(); }, [load]);

  const handleExport = useCallback(async (format) => {
    if (!device) return;
    try {
      const startDate = new Date(Date.now() - timeRange * 3_600_000).toISOString();
      const res = await exportSensorHistory(device.deviceId, { format, startDate });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${device.deviceId}-history.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export report'));
    }
  }, [device, timeRange]);

  const socketHandlers = useMemo(() => ({
    'sensor:reading': (data) => {
      // data may be the reading directly or wrapped
      const r = data?.reading ?? data;
      if (!r || !device) return;
      const rid = (r.deviceId || '').toUpperCase();
      const did = (device.deviceId || '').toUpperCase();
      if (rid !== did) return;

      setLiveReading(r);
      setChartData((prev) => {
        const pt = {
          ts: r.timestamp || new Date().toISOString(),
          Temp: r.temperature != null ? +r.temperature.toFixed(2) : null,
          Humidity: r.humidity != null ? +r.humidity.toFixed(1) : null,
          door: r.doorStatus,
        };
        return [...prev.slice(-299), pt];
      });
    },
    'device:status': (data) => {
      if (!device || !data) return;
      const did = (data.deviceId || '').toUpperCase();
      const myId = (device.deviceId || '').toUpperCase();
      if (did !== myId && data._id !== id) return;
      setDevice((d) => d ? { ...d, status: data.status || d.status } : d);
    },
  }), [device, id]);

  useSocket(socketHandlers);

  // Join the device-specific socket room so 'sensor:reading'/'device:status' events for
  // this device actually reach us (server only emits those into `device:<mongoId>`, not
  // the auto-joined dashboard room).
  useEffect(() => {
    if (!device?._id) return;
    emitSocketEvent('join:device', device._id);
    return () => emitSocketEvent('leave:device', device._id);
  }, [device?._id]);

  if (loading) return <LoadingSkeleton />;

  if (!device) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <FiCpu size={40} className="text-gray-300" />
      <p className="text-gray-400">Device not found</p>
      <button onClick={() => navigate('/admin/devices')} className="text-sm text-[#2E3A8C] hover:underline">
        ← Back to Devices
      </button>
    </div>
  );

  const doorOpen = liveReading?.doorStatus === 'open';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/devices')}
            className="p-2 text-[#49608c] hover:text-[#2E3A8C] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-[#2E3A8C]">{device.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[device.status] || 'bg-gray-100 text-gray-600'}`}>
                {device.status}
              </span>
            </div>
            <p className="text-sm text-[#49608c] flex items-center gap-1.5">
              <span className="font-mono">{device.deviceId}</span>
              {device.location && (
                <><span className="text-gray-300">·</span><FiMapPin size={11} />{device.location}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiDownload size={13} /> Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiDownload size={13} /> PDF
          </button>
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Live Reading Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Temperature */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <FiThermometer size={20} className="text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2E3A8C]">
              {liveReading?.temperature != null ? `${liveReading.temperature.toFixed(1)}°C` : '—'}
            </div>
            <div className="text-xs text-[#49608c]">Temperature</div>
            {stats && <div className="text-xs text-gray-400">{stats.minTemp?.toFixed(1)}° – {stats.maxTemp?.toFixed(1)}°</div>}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <FiDroplet size={20} className="text-blue-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2E3A8C]">
              {liveReading?.humidity != null ? `${liveReading.humidity.toFixed(0)}%` : '—'}
            </div>
            <div className="text-xs text-[#49608c]">Humidity</div>
            {stats && <div className="text-xs text-gray-400">avg {stats.avgHumidity?.toFixed(0)}%</div>}
          </div>
        </div>

        {/* VOC */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <FiWind size={18} className="text-purple-500" />
          </div>
          <div>
            <div className={`text-lg font-bold ${vocQuality(liveReading?.voc).cls}`}>
              {liveReading?.voc != null ? liveReading.voc : '—'}
            </div>
            <div className="text-xs text-[#49608c]">VOC Index</div>
            <div className={`text-xs font-medium ${vocQuality(liveReading?.voc).cls}`}>
              {vocQuality(liveReading?.voc).label}
            </div>
          </div>
        </div>

        {/* Compressor */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${liveReading?.compressor ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <FiZap size={18} className={liveReading?.compressor ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div>
            <div className={`text-lg font-bold ${liveReading?.compressor ? 'text-blue-600' : 'text-gray-400'}`}>
              {liveReading?.compressor == null ? '—' : liveReading.compressor ? 'On' : 'Off'}
            </div>
            <div className="text-xs text-[#49608c]">Compressor</div>
            {stats?.compressorOnCount != null && (
              <div className="text-xs text-gray-400">
                {stats.compressorOnCount}/{stats.readingsCount ?? 0} on
              </div>
            )}
          </div>
        </div>

        {/* Door */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doorOpen ? 'bg-red-50' : 'bg-green-50'}`}>
            <MdDoorFront size={20} className={doorOpen ? 'text-red-500' : 'text-green-600'} />
          </div>
          <div>
            <div className={`text-lg font-bold capitalize ${doorOpen ? 'text-red-500' : 'text-green-600'}`}>
              {liveReading?.doorStatus || '—'}
            </div>
            <div className="text-xs text-[#49608c]">Door</div>
            {doorOpen && <div className="text-xs text-red-400 font-medium">Alert!</div>}
          </div>
        </div>

        {/* Last Reading */}
        <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <FiClock size={18} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#2E3A8C]">
              {liveReading?.timestamp ? fmtTime(liveReading.timestamp) : '—'}
            </div>
            <div className="text-xs text-[#49608c]">Last Reading</div>
            {stats && <div className="text-xs text-gray-400">{stats.readingsCount ?? 0} pts</div>}
          </div>
        </div>
      </div>

      {/* Chart + Side panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold text-[#2E3A8C]">Temperature & Humidity History</h2>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
              {TIME_RANGES.map(({ label, hours }) => (
                <button
                  key={hours}
                  onClick={() => setTimeRange(hours)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    timeRange === hours
                      ? 'bg-white text-[#2E3A8C] shadow-sm'
                      : 'text-[#49608c] hover:text-[#2E3A8C]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <FiThermometer size={28} className="text-gray-300" />
              <span className="text-sm">No sensor data for this period</span>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis
                    dataKey="ts"
                    tickFormatter={fmtTime}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval="preserveStartEnd"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="temp"
                    orientation="left"
                    tick={{ fontSize: 10, fill: '#f97316' }}
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={false}
                    unit="°"
                  />
                  <YAxis
                    yAxisId="hum"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#3b82f6' }}
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                  <Area
                    yAxisId="temp"
                    type="monotone"
                    dataKey="Temp"
                    stroke="#f97316"
                    fill="url(#tempGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="hum"
                    type="monotone"
                    dataKey="Humidity"
                    stroke="#3b82f6"
                    fill="url(#humGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Stats row below chart */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                  {[
                    { label: 'Avg Temp',  value: `${stats.avgTemp?.toFixed(1) ?? '—'}°C`,  color: 'text-orange-500' },
                    { label: 'Min Temp',  value: `${stats.minTemp?.toFixed(1) ?? '—'}°C`,  color: 'text-blue-500' },
                    { label: 'Max Temp',  value: `${stats.maxTemp?.toFixed(1) ?? '—'}°C`,  color: 'text-red-500' },
                    { label: 'Avg Humidity', value: `${stats.avgHumidity?.toFixed(0) ?? '—'}%`, color: 'text-blue-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className={`text-base font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Device Info */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-[#2E3A8C] mb-3 flex items-center gap-2 text-sm">
              <FiCpu size={15} /> Device Info
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Device ID',   value: device.deviceId },
                { label: 'Location',    value: device.location || '—' },
                { label: 'Assigned Crop', value: device.assignedVegetable?.name || '—' },
                { label: 'Last Seen',   value: fmtDateTime(device.lastSeen) },
                ...(device.description ? [{ label: 'Description', value: device.description }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-xs font-medium text-[#2E3A8C] text-right">{value}</span>
                </div>
              ))}

              {device.assignedVegetable?.temperature && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-1.5">Target Ranges</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <FiThermometer size={11} className="text-orange-400" />
                      <span className="text-orange-600 font-medium">
                        {device.assignedVegetable.temperature.min}°C – {device.assignedVegetable.temperature.max}°C
                      </span>
                    </div>
                    {device.assignedVegetable.humidity && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <FiDroplet size={11} className="text-blue-400" />
                        <span className="text-blue-600 font-medium">
                          {device.assignedVegetable.humidity.min}% – {device.assignedVegetable.humidity.max}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-[#2E3A8C] mb-3 flex items-center gap-2 text-sm">
              <FiAlertTriangle size={15} /> Recent Alerts
            </h3>
            {alerts.length === 0 ? (
              <div className="text-center py-5 text-gray-400 text-xs">No alerts for this device</div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((a) => (
                  <div key={a._id} className={`text-xs p-2.5 rounded-lg border ${SEVERITY_COLOR[a.severity] || 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold capitalize">{a.severity}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        a.status === 'active'       ? 'bg-red-100 text-red-700' :
                        a.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-green-100 text-green-700'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-0.5">{a.message}</p>
                    <p className="text-gray-400">{fmtDateTime(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;
