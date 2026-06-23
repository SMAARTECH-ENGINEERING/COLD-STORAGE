import api from './axios';

export const getUsers = (params) =>
  api.get('/users', { params });

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const createUser = (data) =>
  api.post('/users', data);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data);

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);

export const activateUser = (id) =>
  api.patch(`/users/${id}/activate`);

export const deactivateUser = (id) =>
  api.patch(`/users/${id}/deactivate`);

export const assignDevices = (id, deviceIds) =>
  api.post(`/users/${id}/devices`, { deviceIds });

export const removeDevices = (id, deviceIds) =>
  api.delete(`/users/${id}/devices`, { data: { deviceIds } });

export const assignStorageUnits = (id, storageUnitIds) =>
  api.post(`/users/${id}/storage-units`, { storageUnitIds });
 
export const removeStorageUnits = (id, storageUnitIds) =>
  api.delete(`/users/${id}/storage-units`, { data: { storageUnitIds } });
