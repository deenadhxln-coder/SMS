import React from 'react';
import { 
  Building2, 
  Layers, 
  ScrollText, 
  BarChart3, 
  Activity, 
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const FeatureGrid = () => {
  const features = [
    {
      icon: Building2,
      tag: 'Lifecycle & Provisioning',
      title: 'Tenant Management',
      description: 'Manage schools, subscriptions, status, and tenant lifecycle from one place with automatic subdomain routing and initial admin provisioning.',
      accent: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/10'
    },
    {
      icon: Layers,
      tag: 'Cross-School Governance',
      title: 'Platform Operations',
      description: 'Understand what is happening across your entire school ecosystem with global overview metrics, status monitoring, and centralized administrative controls.',
      accent: 'border-blue-500/20 text-blue-400 bg-blue-500/10'
    },
    {
      icon: ScrollText,
      tag: 'Forensic Accountability',
      title: 'Audit & Accountability',
      description: 'Track important platform activity with searchable audit history capturing tenant mutations, plan upgrades, and security events with full JSON payloads.',
      accent: 'border-purple-500/20 text-purple-400 bg-purple-500/10'
    },
    {
      icon: BarChart3,
      tag: 'Operational Intelligence',
      title: 'Platform Analytics',
      description: 'Turn platform activity into useful operational insight with distribution charts, student population growth curves, and capacity quota metrics.',
      accent: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
    },
    {
      icon: Activity,
      tag: 'Infrastructure Telemetry',
      title: 'System Health',
      description: 'Monitor platform health and connectivity from a centralized view, checking MySQL connection pools, Redis cache status, and WebSocket socket channels.',
      accent: 'border-amber-500/20 text-amber-400 bg-amber-500/10'
    },
    {
      icon: ShieldCheck,
      tag: 'Cryptographic Scoping',
      title: 'Secure Multi-Tenancy',
      description: 'Keep schools isolated while giving platform administrators centralized control through verified JWT context and strictly parameterized queries.',
      accent: 'border-rose-500/20 text-rose-400 bg-rose-500/10'
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-950 text-slate-100 text-left relative overflow-hidden border-t border-slate-900">
      
      {/* Ambient background lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={13} />
            <span>CORE PLATFORM CAPABILITIES</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything your platform team needs to stay in control.
          </h2>
          
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            DHXLN provides a unified platform control center engineered specifically for multi-tenant educational networks, SaaS operators, and educational technology teams.
          </p>
        </div>

        {/* Feature Cards Grid (3 columns on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div className="space-y-4">
                  
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${f.accent}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      0{idx + 1}
                    </span>
                  </div>

                  {/* Title & Tag */}
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 block tracking-wider uppercase mb-1">
                      {f.tag}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                      {f.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {f.description}
                  </p>

                </div>

                {/* Subtle Card Footer Indicator */}
                <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">Engine Feature</span>
                  <span className="text-slate-400 group-hover:text-indigo-400 transition-colors flex items-center gap-1 font-semibold">
                    Production Ready <ArrowRight size={12} />
                  </span>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </section>
  );
};

export default FeatureGrid;
