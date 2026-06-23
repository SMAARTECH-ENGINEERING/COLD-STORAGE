import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../Screens/Admin/Dashboard';
import Users from '../Screens/Admin/Users';
import Roles from '../Screens/Admin/Roles';
import Devices from '../Screens/Admin/Devices';
import Vegetables from '../Screens/Admin/Vegetables';
import StorageUnits from '../Screens/Admin/StorageUnits';
import Alerts from '../Screens/Admin/Alerts';
import Profile from '../Screens/Admin/Profile';
import Settings from '../Screens/Admin/Settings';
import AuditLogs from '../Screens/Admin/AuditLogs';
import Login from '../Screens/Auth/Login';
import NotFound from '../Screens/404';

const userRoutes = [
  { path: '/admin/dashboard', component: <Dashboard /> },
  { path: '/admin/devices', component: <Devices /> },
  { path: '/admin/alerts', component: <Alerts /> },
  { path: '/admin/vegetables', component: <Vegetables /> },
  { path: '/admin/storage-units', component: <StorageUnits /> },
  { path: '/admin/users', component: <Users /> },
  { path: '/admin/roles', component: <Roles /> },
  { path: '/admin/audit-logs', component: <AuditLogs /> },
  { path: '/admin/profile', component: <Profile /> },
  { path: '/admin/settings', component: <Settings /> },
  { path: '/admin/', exact: true, component: <Navigate to="/admin/dashboard" replace /> },
  { path: '/admin/*', component: <NotFound /> },
];

const authRoutes = [
  { path: '/', component: <Login /> },
];

export { userRoutes, authRoutes };
