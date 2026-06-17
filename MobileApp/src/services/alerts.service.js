import api from './axios.instance';

function adaptAlert(a) {
  return {
    id: a._id,
    deviceId: a.device?.deviceId || a.deviceId || '',
    deviceName: a.device?.name || '',
    type: a.alertType || a.type || 'Unknown',
    severity: a.severity,
    message: a.message || '',
    status: a.status
      ? a.status.charAt(0).toUpperCase() + a.status.slice(1)
      : 'Active',
    value: a.value,
    threshold: a.threshold,
    createdAt: a.createdAt,
    acknowledgedAt: a.acknowledgedAt,
    resolvedAt: a.resolvedAt,
  };
}

export const AlertsService = {
  list: async (filter) => {
    const params = { limit: 100, sortBy: 'createdAt:desc' };
    if (filter && filter !== 'All') params.status = filter.toLowerCase();

    const { data } = await api.get('/alerts', { params });
    return (data.data || []).map(adaptAlert);
  },

  getById: async (id) => {
    const { data } = await api.get(`/alerts/${id}`);
    return adaptAlert(data.data);
  },

  acknowledge: async (id) => {
    const { data } = await api.patch(`/alerts/${id}/acknowledge`);
    return adaptAlert(data.data);
  },

  resolve: async (id) => {
    const { data } = await api.patch(`/alerts/${id}/resolve`);
    return adaptAlert(data.data);
  },
};
