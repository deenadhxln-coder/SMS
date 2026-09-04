import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@sms/auth';

const PrivateRoute = () => {
  const { token, user, logout } = useAuthStore();

  if (!token || user?.role !== 'Super Admin') {
    if (user?.role && user?.role !== 'Super Admin') {
      logout();
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
