import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@sms/auth';

// Layout Wrappers
import PrivateRoute from './components/layout/PrivateRoute';
import RoleRoute from './components/layout/RoleRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import StudentsList from './pages/students/StudentsList';
import TeachersList from './pages/teachers/TeachersList';
import AcademicsPage from './pages/classes/AcademicsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import ExamsPage from './pages/examinations/ExamsPage';
import FeesPage from './pages/fees/FeesPage';
import ReportsPage from './pages/reports/ReportsPage';
import Settings from './pages/settings/Settings';

const queryClient = new QueryClient();

function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route path="/settings" element={<Settings />} />

            {/* Admin-only configuration routes */}
            <Route element={<RoleRoute allowedRoles={['School Admin']} />}>
              <Route path="/students" element={<StudentsList />} />
              <Route path="/teachers" element={<TeachersList />} />
              <Route path="/classes" element={<AcademicsPage />} />
              <Route path="/subjects" element={<AcademicsPage />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
