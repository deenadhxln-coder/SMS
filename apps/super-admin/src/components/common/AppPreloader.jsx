import React, { useState, useEffect } from 'react';
import { Server, ShieldCheck, RefreshCw } from 'lucide-react';

/**
 * Global Startup Preloader for Super Admin (DHXLN App)
 * - Brand: "DHXLN App"
 * - Subtitle: "Platform Control Center"
 * - Zero artificial delay: transitions out as soon as application shell is ready.
 * - Respects prefers-reduced-motion and accessibility standards.
 */
const AppPreloader = ({ isReady = false, onTransitionEnd }) => {
  const [mounted, setMounted] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showFailsafe, setShowFailsafe] = useState(false);

  useEffect(() => {
    // 5-second failsafe to prevent infinite blank screen in network partition scenarios
    const timer = setTimeout(() => {
      if (!isReady) {
        setShowFailsafe(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isReady]);

  useEffect(() => {
    if (isReady && !isExiting) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setMounted(false);
        if (onTransitionEnd) onTransitionEnd();
      }, 350); // Matches CSS transition duration
      return () => clearTimeout(exitTimer);
    }
  }, [isReady, isExiting, onTransitionEnd]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading DHXLN App Platform Control Center"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-300 ease-out select-none ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Subtle Gradient Lighting */}
      <div 
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/30 via-slate-950 to-slate-950 pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Brand Mark */}
        <div className="relative mb-6">
          <div 
            aria-hidden="true"
            className="absolute -inset-2 rounded-2xl bg-indigo-500/20 blur-xl animate-pulse"
          />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-indigo-500 to-indigo-700 p-0.5 shadow-2xl shadow-indigo-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
              <Server className="w-8 h-8 text-indigo-400" strokeWidth={2.2} />
            </div>
          </div>
        </div>

        {/* Product Identity */}
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 font-outfit">
          DHXLN App
        </h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-8 font-mono">
          Platform Control Center
        </p>

        {/* Indeterminate Progress Line */}
        <div 
          className="w-48 h-1 bg-slate-800/80 rounded-full overflow-hidden relative mb-4 border border-slate-700/50"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full animate-preloader-sweep" />
        </div>

        <span className="text-[11px] font-medium text-slate-400 tracking-wide">
          Initializing platform console...
        </span>

        {/* Failsafe in case of prolonged initialization */}
        {showFailsafe && (
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col items-center gap-2 animate-fade-in">
            <p className="text-xs text-slate-400">Application taking longer than expected?</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw size={13} /> Reload Platform
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppPreloader;
