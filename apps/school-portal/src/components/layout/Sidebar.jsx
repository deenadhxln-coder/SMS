import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, Bookmark, BookOpen,
  CalendarCheck, ClipboardSignature, CreditCard, FileSpreadsheet, 
  Settings, LogOut, Menu, Megaphone, ShieldCheck 
} from 'lucide-react';
import useAuthStore from '@sms/auth';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const role = user?.role;

  // Filter links by RBAC permission matrix
  const getNavLinks = () => {
    const allLinks = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
        roles: ['School Admin', 'Teacher', 'Student', 'Parent']
      },
      {
        path: '/students',
        label: 'Students',
        icon: <Users size={20} />,
        roles: ['School Admin']
      },
      {
        path: '/teachers',
        label: 'Teachers',
        icon: <GraduationCap size={20} />,
        roles: ['School Admin']
      },
      {
        path: '/classes',
        label: 'Classes & Sections',
        icon: <Bookmark size={20} />,
        roles: ['School Admin']
      },
      {
        path: '/subjects',
        label: 'Subjects Mappings',
        icon: <BookOpen size={20} />,
        roles: ['School Admin']
      },
      {
        path: '/attendance',
        label: 'Attendance',
        icon: <CalendarCheck size={20} />,
        roles: ['School Admin', 'Teacher', 'Student', 'Parent']
      },
      {
        path: '/examinations',
        label: 'Examinations',
        icon: <ClipboardSignature size={20} />,
        roles: ['School Admin', 'Teacher', 'Student', 'Parent']
      },
      {
        path: '/fees',
        label: 'Fees & Invoices',
        icon: <CreditCard size={20} />,
        roles: ['School Admin', 'Student', 'Parent']
      },
      {
        path: '/reports',
        label: 'Reports & Analytics',
        icon: <FileSpreadsheet size={20} />,
        roles: ['School Admin', 'Teacher']
      },
      {
        path: '/announcements',
        label: 'Announcements',
        icon: <Megaphone size={20} />,
        roles: ['School Admin', 'Teacher', 'Student', 'Parent']
      },
      {
        path: '/audit-logs',
        label: 'Audit Trail',
        icon: <ShieldCheck size={20} />,
        roles: ['School Admin']
      },
      {
        path: '/settings',
        label: 'Settings & Logs',
        icon: <Settings size={20} />,
        roles: ['School Admin', 'Teacher', 'Student', 'Parent']
      }
    ];

    return allLinks.filter(link => link.roles.includes(role));
  };

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
            {user?.tenant?.logoUrl && (
              <img 
                src={user.tenant.logoUrl} 
                alt="School Logo" 
                className="w-7 h-7 object-contain rounded bg-white p-0.5" 
              />
            )}
            <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent uppercase select-none truncate">
              {user?.tenant?.schoolName || 'Academics Pro'}
            </span>
          </div>
        )}
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-auto flex-shrink-0"
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
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
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
