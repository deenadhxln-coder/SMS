import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@sms/auth';

// Layout Wrappers
import PrivateRoute from './components/layout/PrivateRoute';
import RoleRoute from './components/layout/RoleRoute';
import OfflineBanner from './components/OfflineBanner';
import AppPreloader from './components/common/AppPreloader';

// Lazy Loaded Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const StudentsList = lazy(() => import('./pages/students/StudentsList'));
const TeachersList = lazy(() => import('./pages/teachers/TeachersList'));
const AcademicsPage = lazy(() => import('./pages/classes/AcademicsPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const ExamsPage = lazy(() => import('./pages/examinations/ExamsPage'));
const FeesPage = lazy(() => import('./pages/fees/FeesPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage'));
const Settings = lazy(() => import('./pages/settings/Settings'));

const queryClient = new QueryClient();

// Lightweight Lazy Chunk Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Loading Workspace...</span>
    </div>
  </div>
);

function App() {
  const { token } = useAuthStore();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Mark app shell as ready immediately upon React mount & auth store initialization
    setIsAppReady(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppPreloader isReady={isAppReady} />
      <BrowserRouter>
        <OfflineBanner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!token ? <Login /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/register" 
              element={!token ? <Register /> : <Navigate to="/dashboard" replace />} 
            />

            {/* Secure App Shell Routes */}
            <Route element={<PrivateRoute />}>
              
              {/* Common Authenticated Landing */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/examinations" element={<ExamsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/settings" element={<Settings />} />

              {/* Admin-only configuration routes */}
              <Route element={<RoleRoute allowedRoles={['School Admin']} />}>
                <Route path="/students" element={<StudentsList />} />
                <Route path="/teachers" element={<TeachersList />} />
                <Route path="/classes" element={<AcademicsPage />} />
                <Route path="/subjects" element={<AcademicsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Billing Invoicing (Admins and Parents/Students allowed) */}
              <Route element={<RoleRoute allowedRoles={['School Admin', 'Student', 'Parent']} />}>
                <Route path="/fees" element={<FeesPage />} />
              </Route>

              {/* Analytics Reports (Admins and Teachers allowed) */}
              <Route element={<RoleRoute allowedRoles={['School Admin', 'Teacher']} />}>
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

            </Route>

            {/* Redirect rule */}
            <Route 
              path="*" 
              element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

