import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Bell, User, Calendar, ChevronDown } from 'lucide-react';
import useAuthStore from '@sms/auth';

const Header = () => {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  // SaaS Admin does not require academicYear selector

  useEffect(() => {
    if (!token) return;

    // Connect to WebSocket server
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
      auth: { token }
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
    <header className="h-16 bg-slate-900 border-b border-slate-850 px-6 flex items-center justify-between relative text-left">
      
      {/* Welcome Message */}
      <div>
        <h2 className="text-sm font-semibold text-white">
          Welcome back, <span className="text-purple-400 font-bold">{user?.name}</span>
        </h2>
        <p className="text-2xs text-slate-400 uppercase tracking-wider font-extrabold">
          {user?.role} Profile
        </p>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        
        {/* Real-time Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              if (!showNotifDropdown) markAllAsRead();
            }}
            className="p-2 hover:bg-slate-950 rounded-xl text-slate-400 hover:text-slate-200 transition-colors relative animate-pulse-subtle"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900"></span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-950 rounded-2xl border border-slate-850 shadow-xl overflow-hidden z-50 animate-fade-in text-left">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-850 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-200">Recent Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-3xs bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-850 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-500 font-medium">
                    No new alerts or receipts.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-3.5 hover:bg-slate-900/50 transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-200">{notif.title}</span>
                        <span className="text-3xs text-slate-400 font-semibold">{notif.time}</span>
                      </div>
                      <p className="text-2xs text-slate-400 font-medium leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Card */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/20">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
