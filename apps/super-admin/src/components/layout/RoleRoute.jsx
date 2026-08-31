import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@sms/auth';

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  const roleName = user?.role;

  if (!roleName || !allowedRoles.includes(roleName)) {
    // User is authenticated but doesn't have permissions for this page
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
