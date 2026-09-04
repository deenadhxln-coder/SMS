import React from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Activity, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  CheckCircle2,
  Server,
  Building2,
  ShieldCheck
} from 'lucide-react';

const OperationsQuestions = () => {
  const cards = [
    {
      question: "How is the platform doing?",
      answer: "Instant telemetry across all institutional nodes, total active schools, and aggregate student allocations.",
      icon: Activity,
      preview: (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Aggregated Status</span>
            <span className="text-emerald-400">● 100% Online</span>
          </div>
          <p className="text-slate-300 font-bold font-sans text-xs">All 14 Tenant Instances Active</p>
        </div>
      )
    },
    {
      question: "Which schools need attention?",
      answer: "Track subscription tier capacity quotas (100, 500, Unlimited) and identify schools nearing student limits.",
      icon: AlertTriangle,
      preview: (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>St. Jude High School</span>
            <span className="text-purple-400">PREMIUM</span>
          </div>
          <p className="text-slate-300 font-bold font-sans text-xs">Uncapped Quota • Healthy</p>
        </div>
      )
    },
    {
      question: "What changed recently?",
      answer: "Searchable platform audit trail documenting tenant additions, plan migrations, and admin actions.",
      icon: Clock,
      preview: (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span className="text-indigo-400 font-bold">DEPLOY_TENANT</span>
            <span className="text-slate-500">Recorded</span>
          </div>
          <p className="text-slate-300 font-bold font-sans text-xs">Provisioned: Oakridge Academy</p>
        </div>
      )
    },
    {
      question: "Are core systems healthy?",
      answer: "Dedicated liveness & readiness health checks monitoring MySQL connection pool, Redis cache, and WebSockets.",
      icon: Server,
      preview: (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Readiness Probe</span>
            <span className="text-emerald-400">READY</span>
          </div>
          <p className="text-slate-300 font-bold font-sans text-xs">DB: OK • Redis: OK • Latency: 14ms</p>
        </div>
      )
    }
  ];

  return (
    <section className="py-24 bg-slate-950 text-slate-100 text-left border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles size={13} />
            <span>ADMINISTRATIVE CLARITY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Clear answers to every operational question.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            DHXLN simplifies platform governance by surfacing the exact insights platform administrators need without manual database queries or blind spots.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      "{c.question}"
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {c.answer}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} />
                  </div>
                </div>

                {/* Illustrative preview card */}
                {c.preview}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default OperationsQuestions;
