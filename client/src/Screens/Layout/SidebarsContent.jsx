import React, { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BiSolidDashboard } from 'react-icons/bi';
import { FiUsers, FiCpu, FiBell, FiUser, FiSettings, FiBarChart2, FiBox, FiFileText, FiShield } from 'react-icons/fi';
import { MdOutlineEco } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

const ACTIVE_CLS =
  'flex items-center gap-3 px-4 py-2.5 mt-1 text-sm font-semibold text-white bg-brand-600 rounded-lg cursor-pointer shadow-soft transition-all duration-200';
const INACTIVE_CLS =
  'flex items-center gap-3 px-4 py-2.5 mt-1 text-sm font-medium text-ink rounded-lg cursor-pointer hover:bg-brand-50 hover:text-brand-600 hover:translate-x-0.5 transition-all duration-200';

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
      path: '/admin/roles',
      label: 'Roles',
      icon: <FiShield size={20} />,
      show: hasPermission('roles', 'read'),
    },
    {
      path: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: <FiFileText size={20} />,
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
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <div
            key={item.path}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? ACTIVE_CLS : INACTIVE_CLS}
            onClick={() => handleClick(item.path)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(item.path); } }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default SidebarsContent;
