import api from './axios.instance';

export const ProfileService = {
  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    const u = data.data;
    return {
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role?.displayName || u.role?.name || (typeof u.role === 'string' ? u.role : 'user'),
      assignedDevices: (u.assignedDevices || []).map((d) =>
        typeof d === 'object' ? d.name || d.deviceId : d
      ),
    };
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },
};
