import api from './axios';

export const getDevices = (params) =>
  api.get('/devices', { params });

export const getDevice = (id) =>
  api.get(`/devices/${id}`);

export const createDevice = (data) =>
  api.post('/devices', data);

export const updateDevice = (id, data) =>
  api.put(`/devices/${id}`, data);

export const deleteDevice = (id) =>
  api.delete(`/devices/${id}`);

export const assignVegetable = (id, vegetableId) =>
  api.post(`/devices/${id}/vegetable`, { vegetableId });

export const removeVegetable = (id) =>
  api.delete(`/devices/${id}/vegetable`);
