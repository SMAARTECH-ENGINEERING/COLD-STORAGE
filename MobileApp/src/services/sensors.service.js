import api from './axios.instance';
import { API_URL } from '../config/env';

export const SensorsService = {
  getHistory: async (deviceId, range = '24h') => {
    const { data } = await api.get(`/sensors/${deviceId}/history`, {
      params: { limit: 50, sortBy: 'timestamp:desc', range },
    });
    return (data.data || []).map((r) => ({
      temperature: r.temperature,
      humidity: r.humidity,
      doorStatus: r.doorStatus
        ? r.doorStatus.charAt(0).toUpperCase() + r.doorStatus.slice(1)
        : '--',
      voc: r.voc,
      compressor: r.compressor,
      timestamp: r.timestamp || r.createdAt,
    }));
  },

  getStats: async (deviceId, hours = 24) => {
    const { data } = await api.get(`/sensors/${deviceId}/stats`, {
      params: { hours },
    });
    return data.data || {};
  },

  getLatest: async (deviceId) => {
    const { data } = await api.get(`/sensors/${deviceId}/latest`);
    return data.data || null;
  },

  getExportUrl: (deviceId, range, format) =>
    `${API_URL}/sensors/${deviceId}/export?range=${range}&format=${format}`,

  submitManualReading: async (payload) => {
    const body = {
      deviceId: payload.deviceId,
      temperature: payload.temperature,
      humidity: payload.humidity,
      doorStatus: payload.doorStatus?.toLowerCase() || 'closed',
    };
    const { data } = await api.post('/sensors', body);
    return data;
  },
};
