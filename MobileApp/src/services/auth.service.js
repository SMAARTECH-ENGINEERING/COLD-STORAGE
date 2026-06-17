import * as SecureStore from 'expo-secure-store';
import api from './axios.instance';
import { TOKEN_KEYS } from '../config/env';

function adaptUser(u) {
  if (!u) return null;
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    role: u.role?.displayName || u.role?.name || (typeof u.role === 'string' ? u.role : 'user'),
    assignedDevices: (u.assignedDevices || []).map((d) =>
      typeof d === 'object' ? d.name || d.deviceId : d
    ),
    isActive: u.isActive,
  };
}

export const AuthService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);
    return adaptUser(user);
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      // Best-effort server logout; always clear locally
    }
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
  },

  getCurrentUser: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
    if (!token) return null;
    try {
      const { data } = await api.get('/auth/me');
      return adaptUser(data.data);
    } catch {
      return null;
    }
  },
};
