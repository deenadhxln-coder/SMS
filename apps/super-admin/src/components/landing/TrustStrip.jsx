import React from 'react';
import { ShieldCheck, Database, Zap, Lock, Layers } from 'lucide-react';

const TrustStrip = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Zero-Trust Tenant Boundaries',
      desc: 'Cryptographically verified JWT tenant context'
    },
    {
      icon: Database,
      title: 'Strict Data Isolation',
      desc: '100% tenant-scoped database queries & foreign keys'
    },
    {
      icon: Zap,
      title: 'Real-Time Telemetry',
      desc: 'Redis-cached metrics & isolated WebSocket channels'
    },
    {
      icon: Layers,
      title: 'Enterprise Multi-Tenancy',
      desc: 'Centralized administration with autonomous school nodes'
    }
  ];

  return (
    <section className="py-8 bg-slate-900 border-y border-slate-800/80 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 p-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default TrustStrip;
