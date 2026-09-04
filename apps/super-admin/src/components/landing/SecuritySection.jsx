import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Key, 
  Radio, 
  Sparkles,
  Server,
  CheckCircle2
} from 'lucide-react';

const SecuritySection = () => {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Cryptographic JWT Context',
      desc: 'Tenant identification is strictly validated from signed JWT claims. Client-supplied headers, request bodies, or URL parameters are never trusted for tenant scoping.'
    },
    {
      icon: Database,
      title: 'Parameterized Query Isolation',
      desc: 'All tenant queries are explicitly parameterized and scoped by tenant ID, preventing data leakage and ensuring complete cross-school isolation at the database layer.'
    },
    {
      icon: Key,
      title: 'Role-Based Access Governance',
      desc: 'Multi-tiered authorization segregates Platform Super Administrators from School Administrators, Teachers, Students, and Parents with dedicated middleware guards.'
    },
    {
      icon: Radio,
      title: 'Tenant-Scoped Socket Channels',
      desc: 'Real-time WebSocket events and announcements are isolated to verified tenant-specific socket rooms, ensuring zero cross-tenant event bleed.'
    },
    {
      icon: Server,
      title: 'Isolated Cache Namespaces',
      desc: 'In-memory Redis cache keys and session states are prefixed by verified tenant identifiers to ensure strict isolation across cached operations.'
    },
    {
      icon: ShieldCheck,
      title: 'Searchable Platform Auditability',
      desc: 'Every administrative mutation, onboarding action, and plan migration is recorded with timestamped metadata for complete operational traceability.'
    }
  ];

  return (
    <section id="security" className="py-24 bg-slate-900 text-slate-100 text-left border-t border-slate-800 relative overflow-hidden">
      
      {/* Background Subtle Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={13} />
            <span>SECURITY & ISOLATION ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for a multi-tenant world.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            DHXLN is architected from the ground up around strict tenant isolation, zero client trust, verified authentication contexts, and complete administrative accountability.
          </p>
        </div>

        {/* Security Pillars 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default SecuritySection;
