import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, Bookmark, BookOpen,
  CalendarCheck, ClipboardSignature, CreditCard, FileSpreadsheet, 
  Settings, LogOut, Menu 
} from 'lucide-react';
import useAuthStore from '@sms/auth';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const role = user?.role;

  // Filter links by RBAC permission matrix
  const getNavLinks = () => {
    const allLinks = [
      {
        path: '/',
        label: 'SaaS Console',
        icon: <LayoutDashboard size={20} />,
        roles: ['Super Admin']
      }
    ];

    return allLinks.filter(link => link.roles.includes(role));
  };

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950 text-slate-300 border-r border-slate-900 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-905">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
            <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent uppercase select-none truncate">
              SaaS Control
            </span>
          </div>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors ml-auto flex-shrink-0"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {getNavLinks().map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-150 ${
                isActive 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/10' 
                  : 'hover:bg-slate-900 hover:text-white text-slate-400'
              }`
            }
          >
            <span className="flex-shrink-0">{link.icon}</span>
            {!isCollapsed && <span className="truncate">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile / Logout */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed && (
          <div className="px-3 py-2 bg-slate-800/30 rounded-xl mb-2">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
            <p className="text-2xs text-slate-500 truncate capitalize font-medium">{role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
