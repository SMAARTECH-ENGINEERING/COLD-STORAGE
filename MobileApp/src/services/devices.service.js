import api from './axios.instance';

// Maps a backend device doc to the shape the UI expects
function adaptDevice(d, reading = null) {
  return {
    id: d._id,
    deviceId: d.deviceId,
    name: d.name,
    location: d.location || '',
    online: d.status === 'online',
    status: d.status,
    vegetable: d.assignedVegetable?.name || '',
    lastSeen: d.lastSeen,
    temperature: reading?.temperature ?? null,
    humidity: reading?.humidity ?? null,
    voc: reading?.voc ?? null,
    doorStatus: reading?.doorStatus
      ? reading.doorStatus.charAt(0).toUpperCase() + reading.doorStatus.slice(1)
      : '--',
  };
}

async function fetchLatestReadings(devices) {
  const results = await Promise.allSettled(
    devices.map((d) =>
      api.get(`/sensors/${d.deviceId}/latest`).then((r) => r.data?.data)
    )
  );
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}

export const DevicesService = {
  list: async (filter) => {
    const params = { limit: 100 };
    if (filter === 'online' || filter === 'offline') params.status = filter;

    const { data } = await api.get('/devices', { params });
    const devices = data.data || [];

    const readings = await fetchLatestReadings(devices);
    return devices.map((d, i) => adaptDevice(d, readings[i]));
  },

  getById: async (id) => {
    const { data } = await api.get(`/devices/${id}`);
    const d = data.data;
    if (!d) return null;
    const reading = await api
      .get(`/sensors/${d.deviceId}/latest`)
      .then((r) => r.data?.data)
      .catch(() => null);
    return adaptDevice(d, reading);
  },
};
