import * as SecureStore from 'expo-secure-store';
import {profile as mockProfile} from '../data/profileData';

const KEY = 'COLD_APP_USER';

export const AuthService = {
  login: async (email, password) => {
    // TODO: Replace mock with Axios call to /auth/login
    const user = {...mockProfile};
    await SecureStore.setItemAsync(KEY, JSON.stringify(user));
    return user;
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(KEY);
    return true;
  },
  getCurrentUser: async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
};
