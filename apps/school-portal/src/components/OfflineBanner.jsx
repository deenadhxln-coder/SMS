import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-sm z-50 sticky top-0 animate-fade-in"
    >
      <WifiOff size={15} className="text-slate-950 flex-shrink-0" />
      <span>
        Network connection lost. You are currently offline. Changes will not synchronize until your connection is restored.
      </span>
    </div>
  );
};

export default OfflineBanner;
