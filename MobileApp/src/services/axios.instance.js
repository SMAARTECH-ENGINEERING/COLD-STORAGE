import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL, TOKEN_KEYS } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Called when refresh fails — wired up in App.js
let _onForceLogout = null;
export const setLogoutCallback = (cb) => { _onForceLogout = cb; };

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// Queue of callers waiting for a refresh in progress
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        })
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
      if (!refreshToken) throw new Error('no_refresh');

      // Use plain axios to avoid triggering this interceptor again
      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
      const newAccess = data.data.accessToken;

      await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, newAccess);
      processQueue(null, newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
      await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
      if (_onForceLogout) _onForceLogout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
