import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth.api';
import { destroySocket } from '../hooks/useSocket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
      }
      getMe()
        .then(({ data }) => {
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await apiLogin(email, password);
    const { accessToken, refreshToken, user: userData } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await apiLogout(refreshToken);
    } catch { /* ignore */ } finally {
      destroySocket();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback((resource, action) => {
    if (!user?.role?.permissions) return false;
    const perm = user.role.permissions.find((p) => p.resource === resource);
    return perm ? perm.actions.includes(action) : false;
  }, [user]);

  const isAdmin = useMemo(
    () => user?.role?.name === 'super_admin' || user?.role?.name === 'admin',
    [user]
  );
  const isSuperAdmin = useMemo(() => user?.role?.name === 'super_admin', [user]);

  const value = useMemo(
    () => ({ user, loading, login, logout, hasPermission, isAdmin, isSuperAdmin }),
    [user, loading, login, logout, hasPermission, isAdmin, isSuperAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
