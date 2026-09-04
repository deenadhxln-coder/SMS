import React from 'react';
import { Link } from 'react-router-dom';
import { Server, ShieldCheck, ArrowUpRight } from 'lucide-react';
import useAuthStore from '@sms/auth';

const LandingFooter = () => {
  const { user } = useAuthStore();
  const isAuthenticated = user && user.role === 'Super Admin';

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-left pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-2 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/30">
                <Server size={18} />
              </div>
              <span className="text-sm font-black tracking-wider text-white uppercase">
                DHXLN Platform
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              The centralized multi-tenant control engine powering modern school management SaaS deployments, institutional tenant lifecycles, and operational telemetry.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Platform Core v2.0 • Online</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#overview" className="hover:text-white transition-colors">
                  Overview
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Core Capabilities
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-white transition-colors">
                  Product Showcase
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-white transition-colors">
                  Platform Workflow
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Security Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Administrative Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to={isAuthenticated ? "/dashboard" : "/login"} className="hover:text-white transition-colors flex items-center gap-1">
                  <span>{isAuthenticated ? "Console Dashboard" : "Sign In to Platform"}</span>
                  <ArrowUpRight size={12} />
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link to="/tenants" className="hover:text-white transition-colors">
                      School Tenants
                    </Link>
                  </li>
                  <li>
                    <Link to="/audit-logs" className="hover:text-white transition-colors">
                      Audit Trail
                    </Link>
                  </li>
                  <li>
                    <Link to="/system-health" className="hover:text-white transition-colors">
                      System Health
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} DHXLN App. Multi-Tenant School Management SaaS Platform.</p>
          <div className="flex items-center gap-4">
            <span>Isolated Tenant Scoping</span>
            <span>•</span>
            <span>Verified JWT Security</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
