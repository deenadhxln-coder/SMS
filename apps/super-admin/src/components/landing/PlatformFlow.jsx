import React from 'react';
import { Sparkles, Building2, Shield, BarChart3, ArrowRight } from 'lucide-react';

const PlatformFlow = () => {
  const steps = [
    {
      num: '01',
      title: 'Onboard',
      subtitle: 'Instant Tenant Provisioning',
      desc: 'Deploy a new school institution with dedicated subdomain allocation, default academic year bootstrapping, and initial administrator credential generation in seconds.',
      icon: Building2,
      accent: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/60'
    },
    {
      num: '02',
      title: 'Operate',
      subtitle: 'Centralized Governance',
      desc: 'Manage institutional subscriptions, adjust plan tiers (FREE, STANDARD, PREMIUM), monitor tenant statuses, and maintain centralized administrative control.',
      icon: Shield,
      accent: 'border-blue-500/30 text-blue-400 bg-blue-950/60'
    },
    {
      num: '03',
      title: 'Understand',
      subtitle: 'Telemetry & Forensic Audit',
      desc: 'Leverage immutable audit trails, multi-school operational analytics, and live infrastructure health monitors to make confident, data-driven platform decisions.',
      icon: BarChart3,
      accent: 'border-purple-500/30 text-purple-400 bg-purple-950/60'
    }
  ];

  return (
    <section id="architecture" className="py-24 bg-slate-950 text-slate-100 text-left border-t border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={13} />
            <span>PLATFORM WORKFLOW</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Three steps from institutional onboarding to scale.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            A cohesive administrative lifecycle built to reduce operational friction and provide effortless governance at any school scale.
          </p>
        </div>

        {/* 3 Step Connected Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-6 group shadow-sm hover:shadow-xl"
              >
                <div className="space-y-4">
                  
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-700 group-hover:text-indigo-500/50 transition-colors font-mono">
                      {s.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${s.accent}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-xs font-bold text-indigo-400 tracking-wide uppercase mt-0.5 font-mono">
                      {s.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>

                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center text-[11px] font-semibold text-slate-500 group-hover:text-indigo-400 transition-colors">
                  <span>Step {s.num} Workflow</span>
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
};

export default PlatformFlow;
