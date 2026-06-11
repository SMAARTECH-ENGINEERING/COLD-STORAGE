import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FiBarChart2, FiRefreshCw, FiThermometer, FiCpu,
  FiAlertTriangle, FiDroplet,
} from 'react-icons/fi';
import { getSummary, getDeviceHealth, getTemperatureOverview, getAlertsByDevice } from '../../api/dashboard.api';
import { getData, getList, getErrorMessage } from '../../utils/api.utils';

/* ─── palette ─────────────────────────────────────────────────────────────── */
const PIE_COLORS   = { online: '#22c55e', offline: '#ef4444', maintenance: '#f59e0b' };
const PIE_FALLBACK = '#94a3b8';

const HOURS_OPTIONS = [
  { label: '6h',  value: 6 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '7d',  value: 168 },
];

/* ─── custom tooltips ────────────────────────────────────────────────────── */
const TempTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-[#2E3A8C] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-gray-400">{p.name}</span>
          <span className="font-medium" style={{ color: p.fill ?? p.color }}>{p.value?.toFixed(1)}°C</span>
        </div>
      ))}
    </div>
  );
};

const AlertTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs">
      <p className="font-semibold text-[#2E3A8C] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Active alerts:</span>
        <span className="font-bold text-red-500">{payload[0]?.value}</span>
      </div>
    </div>
  );
};

const PieTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-xs">
      <span className="font-semibold capitalize text-[#2E3A8C]">{name}: </span>
      <span className="font-bold" style={{ color: PIE_COLORS[name] ?? PIE_FALLBACK }}>{value}</span>
    </div>
  );
};

/* ─── custom pie label ───────────────────────────────────────────────────── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ─── skeleton ───────────────────────────────────────────────────────────── */
const ChartSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
    <div className="h-4 w-48 bg-gray-100 rounded mb-4" />
    <div className="h-56 bg-gray-50 rounded" />
  </div>
);

/* ─── summary card ────────────────────────────────────────────────────────── */
const SummaryCard = React.memo(({ icon, label, value, sub, iconBg }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div>
      <div className="text-xl font-bold text-[#2E3A8C]">{value ?? '—'}</div>
      <div className="text-xs text-[#49608c]">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  </div>
));
SummaryCard.displayName = 'SummaryCard';

/* ─── main component ─────────────────────────────────────────────────────── */
const Reports = () => {
  const [summary,     setSummary]     = useState(null);
  const [tempData,    setTempData]    = useState([]);
  const [alertData,   setAlertData]   = useState([]);
  const [pieData,     setPieData]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [hours,       setHours]       = useState(24);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sumRes, healthRes, tempRes, alertRes] = await Promise.all([
        getSummary(),
        getDeviceHealth(),
        getTemperatureOverview(hours),
        getAlertsByDevice(),
      ]);

      setSummary(getData(sumRes));

      // Device health → pie chart
      const healthList = getList(healthRes);
      const counts = healthList.reduce((acc, d) => {
        const s = d.status || 'offline';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      setPieData(
        Object.entries(counts).map(([name, value]) => ({ name, value }))
      );

      // Temperature overview → bar chart
      const tempList = getList(tempRes);
      setTempData(
        tempList.map((d) => ({
          name:  d._id || d.deviceId,
          Avg:   d.avgTemp  != null ? +d.avgTemp.toFixed(1)  : 0,
          Min:   d.minTemp  != null ? +d.minTemp.toFixed(1)  : 0,
          Max:   d.maxTemp  != null ? +d.maxTemp.toFixed(1)  : 0,
          count: d.count,
        }))
      );

      // Alerts by device → bar chart
      const alertList = getList(alertRes);
      setAlertData(
        [...alertList]
          .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
          .slice(0, 10)
          .map((d) => ({
            name:  d.name || d.deviceId,
            Count: d.count ?? 0,
          }))
      );
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, 'Failed to load reports'));
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => { load(); }, [load]);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        icon: <FiCpu size={20} className="text-[#2E3A8C]" />,
        iconBg: 'bg-blue-50',
        label: 'Total Devices',
        value: summary.devices?.total,
        sub: `${summary.devices?.online ?? 0} online`,
      },
      {
        icon: <FiAlertTriangle size={18} className="text-red-500" />,
        iconBg: 'bg-red-50',
        label: 'Active Alerts',
        value: summary.alerts?.active,
        sub: null,
      },
      {
        icon: <FiDroplet size={18} className="text-green-500" />,
        iconBg: 'bg-green-50',
        label: 'Vegetables',
        value: summary.vegetables?.total,
        sub: null,
      },
      {
        icon: <FiThermometer size={18} className="text-orange-500" />,
        iconBg: 'bg-orange-50',
        label: 'Active Users',
        value: summary.users?.active ?? summary.users?.total,
        sub: null,
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FiBarChart2 size={22} className="text-[#2E3A8C]" />
          <h1 className="text-xl font-bold text-[#2E3A8C]">Reports & Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
            {HOURS_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setHours(value)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  hours === value
                    ? 'bg-white text-[#2E3A8C] shadow-sm'
                    : 'text-[#49608c] hover:text-[#2E3A8C]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 text-xs text-[#49608c] border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summaryCards.map((c) => (
            <SummaryCard key={c.label} {...c} />
          ))}
        </div>
      )}

      {/* Top row: temp overview + device status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Temperature per device */}
        {loading ? <div className="xl:col-span-2"><ChartSkeleton /></div> : (
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-[#2E3A8C] mb-1 text-sm">Temperature by Device</h2>
            <p className="text-xs text-gray-400 mb-4">Min / Avg / Max over selected period</p>
            {tempData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tempData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    unit="°"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TempTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar dataKey="Min" fill="#93c5fd" radius={[2, 2, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Avg" fill="#f97316" radius={[2, 2, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Max" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Device status pie */}
        {loading ? <ChartSkeleton /> : (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-[#2E3A8C] mb-1 text-sm">Device Status</h2>
            <p className="text-xs text-gray-400 mb-4">Current connectivity</p>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No data</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[entry.name] ?? PIE_FALLBACK}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: 11, textTransform: 'capitalize' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-gray-100">
                  {pieData.map(({ name, value }) => (
                    <div key={name} className="text-center">
                      <div className="text-lg font-bold" style={{ color: PIE_COLORS[name] ?? PIE_FALLBACK }}>{value}</div>
                      <div className="text-xs text-gray-400 capitalize">{name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alerts by device */}
      {loading ? <ChartSkeleton /> : (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-[#2E3A8C] mb-1 text-sm">Active Alerts by Device</h2>
          <p className="text-xs text-gray-400 mb-4">Top 10 devices with the most active alerts</p>
          {alertData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No active alerts
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={alertData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#49608c' }}
                  width={75}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<AlertTooltip />} />
                <Bar dataKey="Count" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
