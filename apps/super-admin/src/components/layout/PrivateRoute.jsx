import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@sms/auth';
import Sidebar from './Sidebar';
import Header from './Header';

const PrivateRoute = () => {
  const { token } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Page Layout Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PrivateRoute;
