import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  ScrollText, 
  BarChart3, 
  Activity, 
  Menu, 
  LogOut, 
  ChevronLeft,
  ShieldAlert,
  Server,
  CreditCard
} from 'lucide-react';
import useAuthStore from '@sms/auth';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuthStore();

  const navGroups = [
    {
      group: 'Core Platform',
      items: [
        {
          path: '/',
          label: 'Overview',
          icon: LayoutDashboard,
          end: true
        },
        {
          path: '/tenants',
          label: 'School Tenants',
          icon: Building2
        }
      ]
    },
    {
      group: 'Governance & Insights',
      items: [
        {
          path: '/billing',
          label: 'Platform Billing',
          icon: CreditCard
        },
        {
          path: '/audit-logs',
          label: 'Audit Trail',
          icon: ScrollText
        },
        {
          path: '/analytics',
          label: 'Platform Analytics',
          icon: BarChart3
        }
      ]
    },
    {
      group: 'Infrastructure',
      items: [
        {
          path: '/system-health',
          label: 'System Health',
          icon: Activity
        }
      ]
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-200 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Super Admin Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-950/40">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-indigo-600/30">
                <Server size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black tracking-wider text-white uppercase block truncate">
                  SMS Platform
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 block tracking-wide uppercase">
                  Control Center
                </span>
              </div>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-auto"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        ) : (
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group"
            title="Expand sidebar to full"
            aria-label="Expand sidebar to full"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Server size={18} />
            </div>
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {group.group}
              </p>
            )}
            {group.items.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.end}
                  title={isCollapsed ? link.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/20 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 bg-slate-800/50 border border-slate-800 rounded-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate leading-tight">{user?.name || 'Super Administrator'}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'admin@platform'}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Sign out of platform control"
          aria-label="Sign out"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {isCollapsed && (
          <button 
            onClick={toggleSidebar} 
            className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-white"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
