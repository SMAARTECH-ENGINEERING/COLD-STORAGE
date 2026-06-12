import api from './axios';

export const getStorageUnits   = (params)             => api.get('/storage-units', { params });
export const getStorageUnit    = (id)                 => api.get(`/storage-units/${id}`);
export const createStorageUnit = (data)               => api.post('/storage-units', data);
export const updateStorageUnit = (id, data)           => api.put(`/storage-units/${id}`, data);
export const deleteStorageUnit = (id)                 => api.delete(`/storage-units/${id}`);

export const assignDevice      = (id, deviceId)       => api.post(`/storage-units/${id}/devices`, { deviceId });
export const removeDevice      = (id, deviceId)       => api.delete(`/storage-units/${id}/devices/${deviceId}`);

export const assignVegetable   = (id, vegetableId)    => api.post(`/storage-units/${id}/vegetable`, { vegetableId });
export const removeVegetable   = (id)                 => api.delete(`/storage-units/${id}/vegetable`);

export const updateStock       = (id, currentStockKg) => api.patch(`/storage-units/${id}/stock`, { currentStockKg });
export const calculateCapacity = (id, params)         => api.get(`/storage-units/${id}/capacity`, { params });
