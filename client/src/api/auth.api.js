import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refreshToken });

export const logoutAll = () =>
  api.post('/auth/logout-all');

export const getMe = () =>
  api.get('/auth/me');

export const refreshToken = (token) =>
  api.post('/auth/refresh-token', { refreshToken: token });
