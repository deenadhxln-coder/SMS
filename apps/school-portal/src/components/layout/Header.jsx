import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell, User, Calendar, ChevronDown } from 'lucide-react';
import useAuthStore from '@sms/auth';

const Header = () => {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [socketStatus, setSocketStatus] = useState('connecting');

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      setSocketStatus('reconnecting');
    });

    // Listen for fee payment confirmations
    socket.on('FEE_PAYMENT_RECEIPT', (data) => {
      console.log('WS Event FEE_PAYMENT_RECEIPT:', data);
      const newNotif = {
        id: Date.now(),
        title: 'Fee Payment Received',
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    // Listen for announcements
    socket.on('NEW_ANNOUNCEMENT', (data) => {
      console.log('WS Event NEW_ANNOUNCEMENT:', data);
      const newNotif = {
        id: Date.now(),
        title: 'New Announcement',
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    socket.on('connect_error', (err) => {
      console.warn('WebSocket Connection Error:', err.message);
      setSocketStatus('disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between relative">
      
      {/* Welcome Message */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          Welcome back, <span className="text-indigo-600 font-bold">{user?.name}</span>
        </h2>
        <p className="text-2xs text-slate-400 capitalize">
          {user?.role} Profile {user?.tenant?.schoolName ? `• ${user.tenant.schoolName}` : ''}
        </p>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Real-time Connection Status Indicator */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl text-3xs font-bold select-none"
          title={`Real-time network sync: ${socketStatus}`}
        >
          {socketStatus === 'connected' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600">Live</span>
            </>
          ) : socketStatus === 'reconnecting' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-amber-700">Reconnecting</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-slate-500">Offline</span>
            </>
          )}
        </div>

        {/* Academic Year Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <span>AY: {academicYear}</span>
        </div>

        {/* Real-time Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              if (!showNotifDropdown) markAllAsRead();
            }}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Recent Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-3xs bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                    No new alerts or receipts.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800">{notif.title}</span>
                        <span className="text-3xs text-slate-400 font-semibold">{notif.time}</span>
                      </div>
                      <p className="text-2xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to="/announcements"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-2xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View All Announcements →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Card */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
