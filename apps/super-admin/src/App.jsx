import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@sms/auth';

// Layout & Route Guards
import PrivateRoute from './components/layout/PrivateRoute';
import RoleRoute from './components/layout/RoleRoute';
import PlatformLayout from './components/layout/PlatformLayout';
import AppPreloader from './components/common/AppPreloader';

// Lazy Loaded Workspaces
const Login = lazy(() => import('./pages/auth/Login'));
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const TenantsPage = lazy(() => import('./pages/tenants/TenantsPage'));
const BillingPage = lazy(() => import('./pages/billing/BillingPage'));
const AuditLogsPage = lazy(() => import('./pages/audit/AuditLogsPage'));
const PlatformAnalyticsPage = lazy(() => import('./pages/analytics/PlatformAnalyticsPage'));
const SystemHealthPage = lazy(() => import('./pages/system/SystemHealthPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Lightweight Lazy Chunk Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3">
      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider font-mono">Loading Workspace...</span>
    </div>
  </div>
);

function App() {
  const { user } = useAuthStore();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Mark app shell as ready immediately upon React mount & auth store initialization
    setIsAppReady(true);
  }, []);

  const isSuperAdmin = user && user.role === 'Super Admin';

  return (
    <QueryClientProvider client={queryClient}>
      <AppPreloader isReady={isAppReady} />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Explicit Landing Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/public" element={<LandingPage />} />

            {/* Public Route: Login */}
            <Route 
              path="/login" 
              element={isSuperAdmin ? <Navigate to="/" replace /> : <Login />} 
            />

            {/* Root Route: If authenticated Super Admin, render PlatformLayout dashboard; if not, render LandingPage */}
            {isSuperAdmin ? (
              <Route element={<RoleRoute allowedRoles={['Super Admin']} />}>
                <Route element={<PlatformLayout />}>
                  <Route path="/" element={<SuperAdminDashboard />} />
                  <Route path="/dashboard" element={<SuperAdminDashboard />} />
                  <Route path="/overview" element={<Navigate to="/" replace />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/analytics" element={<PlatformAnalyticsPage />} />
                  <Route path="/system-health" element={<SystemHealthPage />} />
                </Route>
              </Route>
            ) : (
              <Route path="/" element={<LandingPage />} />
            )}

            {/* Protected Platform Control Center Routes (Super Admin Only) for deep links */}
            <Route element={<PrivateRoute />}>
              <Route element={<RoleRoute allowedRoles={['Super Admin']} />}>
                <Route element={<PlatformLayout />}>
                  <Route path="/dashboard" element={<SuperAdminDashboard />} />
                  <Route path="/overview" element={<Navigate to="/" replace />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/analytics" element={<PlatformAnalyticsPage />} />
                  <Route path="/system-health" element={<SystemHealthPage />} />
                </Route>
              </Route>
            </Route>

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
