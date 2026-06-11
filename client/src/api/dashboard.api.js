import api from './axios';

export const getSummary = () =>
  api.get('/dashboard/summary');

export const getDeviceHealth = () =>
  api.get('/dashboard/device-health');

export const getTemperatureOverview = (hours = 24) =>
  api.get('/dashboard/temperature-overview', { params: { hours } });

export const getAlertsByDevice = () =>
  api.get('/dashboard/alerts-by-device');

export const getMyDevices = (hours = 24) =>
  api.get('/dashboard/my-devices', { params: { hours } });
