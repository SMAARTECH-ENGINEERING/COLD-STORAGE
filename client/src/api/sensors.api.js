import api from './axios';

export const getLatestReading = (deviceId) =>
  api.get(`/sensors/${deviceId}/latest`);

export const getSensorHistory = (deviceId, params) =>
  api.get(`/sensors/${deviceId}/history`, { params });

export const getSensorStats = (deviceId, hours = 24) =>
  api.get(`/sensors/${deviceId}/stats`, { params: { hours } });

export const ingestReading = (data) =>
  api.post('/sensors', data);

export const exportSensorHistory = (deviceId, params) =>
  api.get(`/sensors/${deviceId}/export`, { params, responseType: 'blob' });
