import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Server, ShieldCheck, Sparkles } from 'lucide-react';
import useAuthStore from '@sms/auth';

const CTASection = () => {
  const { user } = useAuthStore();
  const isAuthenticated = user && user.role === 'Super Admin';

  return (
    <section className="py-24 bg-slate-900 border-t border-slate-800 text-slate-100 text-left relative overflow-hidden">
      
      {/* Ambient background light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
          <Sparkles size={13} className="text-indigo-400" />
          <span>DHXLN PLATFORM CONTROL</span>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your platform. One control center.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Bring tenant management, operations, analytics, and platform visibility together with DHXLN.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span>{isAuthenticated ? "Enter Control Center" : "Sign In to DHXLN"}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span>Restricted to authorized Super Administrators</span>
        </div>

      </div>

    </section>
  );
};

export default CTASection;
