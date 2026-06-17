import api from './axios.instance';

function adaptDevice(d, reading = null) {
  return {
    id: d._id,
    deviceId: d.deviceId,
    name: d.name,
    location: d.location || '',
    online: d.status === 'online',
    status: d.status,
    vegetable: d.assignedVegetable?.name || '',
    temperature: reading?.temperature ?? null,
    humidity: reading?.humidity ?? null,
    doorStatus: reading?.doorStatus
      ? reading.doorStatus.charAt(0).toUpperCase() + reading.doorStatus.slice(1)
      : '--',
  };
}

function adaptAlert(a) {
  return {
    id: a._id,
    deviceId: a.device?.deviceId || a.deviceId || '',
    deviceName: a.device?.name || '',
    type: a.alertType || a.type || 'Unknown',
    severity: a.severity,
    message: a.message || '',
    status: a.status,
    createdAt: a.createdAt,
  };
}

export const DashboardService = {
  getOverview: async () => {
    const [summaryRes, devicesRes, alertsRes] = await Promise.all([
      api.get('/dashboard/summary'),
      api.get('/devices', { params: { limit: 10 } }),
      api.get('/alerts', { params: { status: 'active', limit: 5, sortBy: 'createdAt:desc' } }),
    ]);

    const summary = summaryRes.data.data;
    const devices = devicesRes.data.data || [];
    const alerts = (alertsRes.data.data || []).map(adaptAlert);

    // Fetch latest readings for the first 10 devices
    const readingResults = await Promise.allSettled(
      devices.map((d) =>
        api.get(`/sensors/${d.deviceId}/latest`).then((r) => r.data?.data)
      )
    );

    const adaptedDevices = devices.map((d, i) => {
      const r = readingResults[i];
      return adaptDevice(d, r.status === 'fulfilled' ? r.value : null);
    });

    const criticalAlerts = alerts.filter(
      (a) => a.severity === 'critical' || a.severity === 'high'
    ).length;

    return {
      totalDevices: summary.devices?.total ?? 0,
      onlineDevices: summary.devices?.online ?? 0,
      offlineDevices: summary.devices?.offline ?? 0,
      activeAlerts: summary.alerts?.active ?? 0,
      criticalAlerts,
      assignedDevices: adaptedDevices,
      recentAlerts: alerts,
    };
  },
};
