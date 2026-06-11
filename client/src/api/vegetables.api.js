import api from './axios';

export const getVegetables = (params) =>
  api.get('/vegetables', { params });

export const getVegetable = (id) =>
  api.get(`/vegetables/${id}`);

export const createVegetable = (data) =>
  api.post('/vegetables', data);

export const updateVegetable = (id, data) =>
  api.put(`/vegetables/${id}`, data);

export const deleteVegetable = (id) =>
  api.delete(`/vegetables/${id}`);
