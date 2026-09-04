import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  ScrollText, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Plus, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronRight,
  Zap,
  Crown,
  Shield,
  Clock,
  Radio,
  ExternalLink
} from 'lucide-react';

const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState('tenants'); // 'overview' | 'tenants' | 'audit' | 'system'

  const tabs = [
    { id: 'tenants', label: 'Tenant Management', icon: Building2 },
    { id: 'overview', label: 'Platform Overview', icon: Layers },
    { id: 'audit', label: 'Audit Trail', icon: ScrollText },
    { id: 'system', label: 'System Health', icon: Activity },
  ];

  return (
    <section id="showcase" className="py-24 bg-slate-900 border-t border-slate-800 text-slate-100 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={13} />
            <span>PRODUCT SHOWCASE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            See your entire platform at a glance.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Explore the specialized operational workspaces built into the DHXLN Control Center. Every view is designed for high clarity, fast triage, and strict multi-tenant governance.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Showcase Preview Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-fade-in">
          
          {/* Top Window Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="text-xs font-bold text-slate-300 ml-2">
                DHXLN Control Center • {tabs.find(t => t.id === activeTab)?.label}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400">●</span> Production Viewport
            </div>
          </div>

          {/* Interactive Tab Viewport Preview */}
          <div className="p-4 sm:p-7">
            
            {/* TAB 1: TENANT MANAGEMENT VIEW */}
            {activeTab === 'tenants' && (
              <div className="space-y-6 animate-fade-in text-xs">
                
                {/* Top Action Bar in Showcase */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">School Tenant Workspace</h3>
                    <p className="text-slate-400 text-xs">Manage multi-tenant school deployments, subscription tiers, and subdomains</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-indigo-600/90 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm text-xs">
                      <Plus size={14} /> Onboard School
                    </span>
                  </div>
                </div>

                {/* Search & Filter Mock */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-full md:w-72 text-slate-400">
                    <Search size={14} />
                    <span className="text-slate-500 font-mono">Filter by school or slug...</span>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px]">All Statuses</span>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[11px]">All Tiers</span>
                  </div>
                </div>

                {/* Table Mock */}
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">School Institution</th>
                        <th className="py-3 px-4">Contact Email</th>
                        <th className="py-3 px-4">Subscription Tier</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white font-sans">St. Jude High School</div>
                          <span className="text-[11px] text-indigo-400 font-mono">/st-jude</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">principal@stjude.edu</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">PREMIUM</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">ACTIVE</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-sans">Details</span>
                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-sans">Tier</span>
                          </div>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white font-sans">Oakridge Academy</div>
                          <span className="text-[11px] text-indigo-400 font-mono">/oakridge</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">admin@oakridge.edu</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">STANDARD</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">ACTIVE</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-sans">Details</span>
                            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-sans">Tier</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 2: PLATFORM OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Platform Health & Telemetry</h3>
                    <p className="text-slate-400 text-xs">Global metrics, active nodes, and subscription breakdown</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                    ● All Nodes Operational
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Total Tenants</span>
                    <div className="text-xl font-bold text-white font-mono">14</div>
                    <span className="text-emerald-400 text-[10px]">100% Active</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Enrolled Students</span>
                    <div className="text-xl font-bold text-white font-mono">4,820</div>
                    <span className="text-indigo-400 text-[10px]">Across all clusters</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Avg API Latency</span>
                    <div className="text-xl font-bold text-white font-mono">18ms</div>
                    <span className="text-emerald-400 text-[10px]">Optimal performance</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[11px]">Cache Hit Rate</span>
                    <div className="text-xl font-bold text-white font-mono">94.2%</div>
                    <span className="text-purple-400 text-[10px]">Redis in-memory tier</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>Subscription Plan Distribution</span>
                    <span className="text-slate-400 font-mono text-[11px]">Tier Capacities</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">FREE TIER</span>
                      <p className="text-base font-bold text-slate-200 mt-0.5">3 Schools</p>
                      <span className="text-[10px] text-slate-500">100 max students</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-blue-400 font-bold uppercase">STANDARD TIER</span>
                      <p className="text-base font-bold text-blue-300 mt-0.5">8 Schools</p>
                      <span className="text-[10px] text-slate-500">500 max students</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-purple-400 font-bold uppercase">PREMIUM TIER</span>
                      <p className="text-base font-bold text-purple-300 mt-0.5">3 Schools</p>
                      <span className="text-[10px] text-slate-500">Uncapped students</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT TRAIL VIEW */}
            {activeTab === 'audit' && (
              <div className="space-y-6 animate-fade-in text-xs font-mono">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-sans">
                  <div>
                    <h3 className="text-base font-bold text-white">Immutable Platform Audit Trail</h3>
                    <p className="text-slate-400 text-xs">Searchable, forensic logging for all platform mutations and tenant operations</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-900 text-indigo-400 border border-slate-800 rounded-lg text-xs">
                    Export JSON
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold">
                        CREATE_SCHOOL
                      </span>
                      <span className="text-slate-300 font-sans font-semibold">Deployed new tenant: St. Jude High School</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">Today at 10:14 AM</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-bold">
                        UPDATE_PLAN
                      </span>
                      <span className="text-slate-300 font-sans font-semibold">Migrated Oakridge Academy to STANDARD Tier</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">Yesterday at 04:30 PM</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                        SYSTEM_AUTH
                      </span>
                      <span className="text-slate-300 font-sans font-semibold">Super Administrator authenticated via verified token</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">Yesterday at 09:00 AM</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM HEALTH VIEW */}
            {activeTab === 'system' && (
              <div className="space-y-6 animate-fade-in text-xs font-mono">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-sans">
                  <div>
                    <h3 className="text-base font-bold text-white">System Infrastructure & Connectivity</h3>
                    <p className="text-slate-400 text-xs">Live probe telemetry for database connection pools, cache, and socket channels</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-bold">
                    Readiness: READY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Database Engine</span>
                      <span className="text-emerald-400 font-mono text-xs">CONNECTED</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">MySQL Connection Pool active with zero query leaks.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Redis Cache</span>
                      <span className="text-emerald-400 font-mono text-xs">READY</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">In-memory tenant caching and token blacklisting active.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">Socket.IO Gateway</span>
                      <span className="text-emerald-400 font-mono text-xs">STREAMING</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Real-time tenant-scoped announcement broadcast channel.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};

export default ProductShowcase;
