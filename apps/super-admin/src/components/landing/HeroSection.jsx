import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  ArrowRight, 
  Layers, 
  Building2, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Crown,
  ChevronRight,
  Database,
  Lock
} from 'lucide-react';
import useAuthStore from '@sms/auth';

const HeroSection = () => {
  const { user } = useAuthStore();
  const isAuthenticated = user && user.role === 'Super Admin';

  return (
    <section id="overview" className="relative pt-32 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-slate-950 text-slate-100 text-left">
      
      {/* Background Decorative Radial Gradient & Grid Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Text Column */}
        <div className="max-w-3xl mx-auto text-center space-y-6">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase shadow-inner animate-fade-in">
            <Sparkles size={13} className="text-indigo-400" />
            <span>THE CONTROL CENTER FOR MODERN SCHOOL OPERATIONS</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Run your school platform from{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              one powerful control center.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
            DHXLN gives platform administrators the tools to manage schools, monitor operations, understand growth, and keep a multi-tenant education platform running smoothly.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span>{isAuthenticated ? "Launch Control Center" : "Sign In to Platform"}</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#architecture"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl hover:text-white transition-all focus:outline-none"
            >
              <Layers size={16} className="text-slate-400" />
              <span>Explore Platform</span>
            </a>
          </div>

          {/* Subtle Security Reassurance Note */}
          <div className="pt-2 flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-400" /> Multi-Tenant Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <Lock size={14} className="text-indigo-400" /> Verified JWT Access
            </span>
            <span className="flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" /> Real-time Telemetry
            </span>
          </div>

        </div>

        {/* Hero Visual: Floating Platform Control Center Mockup */}
        <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
          
          {/* Ambient Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-indigo-600/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000" />

          {/* Main Dashboard Preview Container */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden text-slate-200">
            
            {/* Top Mock Window Bar */}
            <div className="h-11 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
              </div>
              <div className="px-4 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                <span className="text-indigo-400">https://</span>console.dhxln.io/overview
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SYSTEM LIVE
              </div>
            </div>

            {/* Dashboard Inner Canvas Preview */}
            <div className="p-5 sm:p-7 space-y-6">
              
              {/* Header inside preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Global Platform Control Center
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time multi-tenant governance, subscription quotas, and system telemetry
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                    Super Admin Console
                  </span>
                </div>
              </div>

              {/* KPI Stat Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Metric 1 */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Active Deployments</span>
                    <Building2 size={16} className="text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">14</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <CheckCircle2 size={12} /> 100% Isolated Subdomains
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Engine Availability</span>
                    <Activity size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">99.98%</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>MySQL Pool + Redis Cache</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Audited Platform Events</span>
                    <Clock size={16} className="text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white font-mono">3,420</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                    <span>Forensic Traceability</span>
                  </div>
                </div>

              </div>

              {/* Split Content: Tenant Distribution + Audit Trail Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Left 7 cols: Active School Tenants */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Monitored Institutional Tenants</span>
                    <span className="text-[11px] text-indigo-400 font-mono">3 Active Examples</span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    
                    {/* Item 1 */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">
                          ST
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200 block truncate font-sans">St. Jude High School</span>
                          <span className="text-[10px] text-indigo-400 font-mono">https://st-jude.sms.edu</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                        PREMIUM
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                          OR
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200 block truncate font-sans">Oakridge Academy</span>
                          <span className="text-[10px] text-indigo-400 font-mono">https://oakridge.sms.edu</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                        STANDARD
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-slate-700 text-slate-300 border border-slate-600 flex items-center justify-center font-bold text-[10px]">
                          HZ
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-200 block truncate font-sans">Horizon STEM Institute</span>
                          <span className="text-[10px] text-indigo-400 font-mono">https://horizon.sms.edu</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">
                        FREE TIER
                      </span>
                    </div>

                  </div>
                </div>

                {/* Right 5 cols: Live Telemetry & Audit Stream */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>Audit Event Stream</span>
                    <span className="text-[10px] text-emerald-400 font-mono">REAL-TIME</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300">DEPLOY_TENANT</span>
                        <span className="text-slate-500 text-[10px]">1m ago</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">slug: st-jude • plan: PREMIUM</p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-300">MIGRATE_TIER</span>
                        <span className="text-slate-500 text-[10px]">14m ago</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">oakridge: FREE → STANDARD</p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-300">HEALTH_PROBE_OK</span>
                        <span className="text-slate-500 text-[10px]">Live</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">Latency: 12ms • All Nodes Green</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default HeroSection;
