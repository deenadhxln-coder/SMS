import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { 
  Bell, 
  Shield, 
  Search, 
  Command, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  Menu,
  Sparkles
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useAuthStore from '@sms/auth';

const Header = ({ onOpenSearch, onToggleMobileNav, onToggleSidebar, isSidebarCollapsed = false }) => {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket server for platform updates
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('NEW_ANNOUNCEMENT', (data) => {
      const newNotif = {
        id: Date.now(),
        title: 'Platform Announcement',
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    socket.on('connect_error', () => {
      // Degraded WS silently handled
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Breadcrumb mapping
  const routeNames = {
    '/': 'Overview',
    '/tenants': 'School Tenants',
    '/audit-logs': 'Audit Trail',
    '/analytics': 'Platform Analytics',
    '/system-health': 'System Health'
  };

  const currentRouteName = routeNames[location.pathname] || 'Platform Control';

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between relative z-30 text-left">
      
      {/* Left: Nav Toggle (Desktop & Mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (typeof onToggleMobileNav === 'function' && window.innerWidth < 1024) {
              onToggleMobileNav();
            } else if (typeof onToggleSidebar === 'function') {
              onToggleSidebar();
            }
          }}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle navigation"
          title={isSidebarCollapsed ? "Expand sidebar to full" : "Collapse sidebar"}
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 hidden sm:inline">Platform</span>
          <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
          <h1 className="font-bold text-slate-900 text-sm tracking-tight">
            {currentRouteName}
          </h1>
        </div>
      </div>

      {/* Center/Right: Quick Search & Controls */}
      <div className="flex items-center gap-3">
        
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:text-slate-900 transition-colors shadow-2xs"
          title="Search school tenants (Ctrl/Cmd + K)"
          aria-label="Search schools (Shortcut Ctrl+K)"
        >
          <Search size={14} className="text-slate-400" />
          <span className="hidden md:inline font-medium">Search schools, slugs...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* System Status Indicator Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full text-[11px] font-semibold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine Live</span>
        </div>

        {/* Real-time Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              if (!showNotifDropdown) markAllAsRead();
            }}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-fade-in text-left">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Platform Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">
                    No active platform alerts or announcements.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
