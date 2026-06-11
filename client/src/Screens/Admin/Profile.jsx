import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiShield, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { updateUser } from '../../api/users.api';
import { getErrorMessage } from '../../utils/api.utils';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const toggleShowPw = useCallback(() => setShowPw((v) => !v), []);
  const clearPwForm  = useCallback(() => setPwForm({ password: '', confirm: '' }), []);

  const handlePasswordChange = useCallback(async (e) => {
    e.preventDefault();
    if (!pwForm.password || pwForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await updateUser(user._id, { password: pwForm.password });
      toast.success('Password updated successfully');
      setPwForm({ password: '', confirm: '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update password'));
    } finally {
      setSavingPw(false);
    }
  }, [user?._id, pwForm]);

  const infoItems = useMemo(() => [
    { icon: <FiUser size={16} />,   label: 'Full Name', value: user?.name },
    { icon: <FiMail size={16} />,   label: 'Email',     value: user?.email },
    { icon: <FiPhone size={16} />,  label: 'Phone',     value: user?.phone || '—' },
    { icon: <FiShield size={16} />, label: 'Role',      value: user?.role?.displayName || user?.role?.name },
  ], [user]);

  if (!user) return null;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#2E3A8C]">Profile</h1>
        <p className="text-sm text-[#49608c]">Your account details</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-[#2E3A8C] rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2E3A8C]">{user.name}</h2>
            <p className="text-sm text-[#49608c] capitalize">{user.role?.displayName || user.role?.name}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoItems.map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-[#f2f6fc] rounded-lg">
              <span className="text-[#2E3A8C] mt-0.5">{icon}</span>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-[#2E3A8C] capitalize">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {user.assignedDevices?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Assigned Devices</p>
            <div className="flex flex-wrap gap-2">
              {user.assignedDevices.map((d) => (
                <span key={d._id || d} className="text-xs bg-blue-50 text-[#2E3A8C] px-2 py-1 rounded-lg font-medium border border-blue-100">
                  {d.deviceId || d.name || d}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
          Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <FiLock size={18} className="text-[#2E3A8C]" />
          <h3 className="font-semibold text-[#2E3A8C]">Change Password</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#49608c] mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.password}
                onChange={(e) => setPwForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
              />
              <button
                type="button"
                onClick={toggleShowPw}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E3A8C]"
              >
                {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#49608c] mb-1">Confirm Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/30"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={savingPw}
              className="flex items-center gap-2 bg-[#2E3A8C] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#1e2d6e] disabled:opacity-60 transition-colors"
            >
              {savingPw && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Update Password
            </button>
            <button
              type="button"
              onClick={clearPwForm}
              className="px-4 py-2 text-sm text-[#49608c] hover:text-[#2E3A8C] border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
