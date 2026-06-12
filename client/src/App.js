import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import NonAuthLayout from './Routes/middleware/NonAuthLayout';
import AuthLayout from './Routes/middleware/AuthLayout';
import Layout from './Screens/Layout/Layout';
import { AuthProvider } from './context/AuthContext';
import Tostify from './Screens/Common/Tostify';
import ErrorBoundary from './Components/common/ErrorBoundary';

// Lazy-loaded pages for code splitting
const Login      = lazy(() => import('./Screens/Auth/Login'));
const Dashboard  = lazy(() => import('./Screens/Admin/Dashboard'));
const Devices    = lazy(() => import('./Screens/Admin/Devices'));
const Alerts     = lazy(() => import('./Screens/Admin/Alerts'));
const Vegetables = lazy(() => import('./Screens/Admin/Vegetables'));
const Users      = lazy(() => import('./Screens/Admin/Users'));
const Profile      = lazy(() => import('./Screens/Admin/Profile'));
const Settings     = lazy(() => import('./Screens/Admin/Settings'));
const StorageUnits = lazy(() => import('./Screens/Admin/StorageUnits'));
const Reports      = lazy(() => import('./Screens/Admin/Reports'));
const DeviceDetail = lazy(() => import('./Screens/Admin/DeviceDetail'));
const NotFound     = lazy(() => import('./Screens/404'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-[#2E3A8C] border-t-transparent rounded-full animate-spin" />
  </div>
);

const authRoutes = [{ path: '/', component: <Login /> }];

const userRoutes = [
  { path: '/admin/dashboard',  component: <Dashboard /> },
  { path: '/admin/devices',    component: <Devices /> },
  { path: '/admin/alerts',     component: <Alerts /> },
  { path: '/admin/vegetables',     component: <Vegetables /> },
  { path: '/admin/storage-units',  component: <StorageUnits /> },
  { path: '/admin/users',          component: <Users /> },
  { path: '/admin/profile',    component: <Profile /> },
  { path: '/admin/settings',      component: <Settings /> },
  { path: '/admin/reports',       component: <Reports /> },
  { path: '/admin/devices/:id',   component: <DeviceDetail /> },
  { path: '/admin/',              component: <Navigate to="/admin/dashboard" replace /> },
  { path: '/admin/*',          component: <NotFound /> },
];

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Tostify />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {authRoutes.map((r, i) => (
            <Route
              key={i}
              path={r.path}
              element={<NonAuthLayout>{r.component}</NonAuthLayout>}
            />
          ))}
          {userRoutes.map((r, i) => (
            <Route
              key={i}
              path={r.path}
              element={
                <AuthLayout>
                  <Layout>
                    <ErrorBoundary>{r.component}</ErrorBoundary>
                  </Layout>
                </AuthLayout>
              }
            />
          ))}
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
