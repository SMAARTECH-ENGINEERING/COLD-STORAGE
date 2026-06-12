import React, { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BiSolidDashboard } from 'react-icons/bi';
import { FiUsers, FiCpu, FiBell, FiUser, FiSettings, FiBarChart2, FiBox } from 'react-icons/fi';
import { MdOutlineEco } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const ACTIVE_CLS =
  'flex items-center gap-3 px-4 py-2.5 mt-1 text-sm font-semibold text-white bg-[#2E3A8C] rounded-lg cursor-pointer transition-all duration-200';
const INACTIVE_CLS =
  'flex items-center gap-3 px-4 py-2.5 mt-1 text-sm font-medium text-[#49608c] rounded-lg cursor-pointer hover:bg-[#eef0f8] hover:text-[#2E3A8C] transition-all duration-200';

const SidebarsContent = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasPermission, isAdmin } = useAuth();

  const menuItems = useMemo(() => [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: <BiSolidDashboard size={20} />,
      show: hasPermission('dashboard', 'read'),
    },
    {
      path: '/admin/devices',
      label: 'Devices',
      icon: <FiCpu size={20} />,
      show: hasPermission('devices', 'read'),
    },
    {
      path: '/admin/alerts',
      label: 'Alerts',
      icon: <FiBell size={20} />,
      show: hasPermission('alerts', 'read'),
    },
    {
      path: '/admin/vegetables',
      label: 'Fruits & Vegs',
      icon: <MdOutlineEco size={20} />,
      show: hasPermission('vegetables', 'read'),
    },
    {
      path: '/admin/storage-units',
      label: 'Storage Units',
      icon: <FiBox size={20} />,
      show: hasPermission('storage_units', 'read'),
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: <FiUsers size={20} />,
      show: isAdmin,
    },
    {
      path: '/admin/reports',
      label: 'Reports',
      icon: <FiBarChart2 size={20} />,
      show: hasPermission('dashboard', 'read'),
    },
    {
      path: '/admin/profile',
      label: 'Profile',
      icon: <FiUser size={20} />,
      show: true,
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: <FiSettings size={20} />,
      show: true,
    },
  ].filter((i) => i.show), [hasPermission, isAdmin]);

  const handleClick = useCallback((path) => navigate(path), [navigate]);

  return (
    <nav className="mt-2">
      {menuItems.map((item) => (
        <div
          key={item.path}
          className={pathname === item.path ? ACTIVE_CLS : INACTIVE_CLS}
          onClick={() => handleClick(item.path)}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default SidebarsContent;
