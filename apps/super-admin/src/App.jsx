import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@sms/auth';

// Layout & Route Guards
import PrivateRoute from './components/layout/PrivateRoute';
import RoleRoute from './components/layout/RoleRoute';
import PageContainer from './components/layout/PageContainer';

// Pages
import Login from './pages/auth/Login';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Route: Login */}
          <Route 
            path="/login" 
            element={user && user.role === 'Super Admin' ? <Navigate to="/" replace /> : <Login />} 
          />

          {/* Protected Routes (Super Admin Only) */}
          <Route element={<PrivateRoute />}>
            <Route element={<RoleRoute allowedRoles={['Super Admin']} />}>
              <Route path="/" element={<SuperAdminDashboard />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
