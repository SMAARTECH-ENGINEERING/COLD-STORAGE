import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import logo from '../../Assets/Logos/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Login successful');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-[#2E3A8C] text-white px-12">
        <div className="mb-8">
          <img src={logo} alt="Smaafrost Logo" className="h-24 w-auto object-contain drop-shadow-lg" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center">Cold Storage Monitor</h1>
        <p className="text-lg text-blue-200 text-center max-w-sm">
          Real-time IoT monitoring for temperature, humidity, and door status across all storage units.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-6 w-full max-w-sm">
          {[
            { label: 'Devices', value: '5+' },
            { label: 'Vegetables', value: '6+' },
            { label: 'Uptime', value: '99%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-blue-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex justify-center items-center p-8 bg-[#f2f6fc]">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="flex items-center gap-2 mb-2 md:hidden">
            <img src={logo} alt="Smaafrost Logo" className="h-8 w-auto object-contain" />
            <span className="text-[#2E3A8C] font-bold text-xl">Cold Storage Monitor</span>
          </div>

          <h2 className="text-2xl font-bold text-[#2E3A8C] mt-2">Welcome back</h2>
          <p className="text-[#49608c] text-sm mt-1 mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/40 focus:border-[#2E3A8C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#49608c] mb-1">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3A8C]/40 focus:border-[#2E3A8C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E3A8C]"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2E3A8C] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1e2d6e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-[#49608c]">
            <div className="font-semibold mb-1 text-[#2E3A8C]">Demo credentials</div>
            <div>superadmin@coldstorage.com / Admin@1234</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
