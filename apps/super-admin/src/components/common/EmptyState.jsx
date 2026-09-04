import React from 'react';
import { Inbox, Search, AlertCircle } from 'lucide-react';

const EmptyState = ({
  icon: CustomIcon,
  title,
  description,
  action,
  type = 'empty' // 'empty' | 'filtered' | 'error'
}) => {
  const getDefaultIcon = () => {
    if (CustomIcon) return <CustomIcon size={32} className="text-slate-400" />;
    if (type === 'filtered') return <Search size={32} className="text-slate-400" />;
    if (type === 'error') return <AlertCircle size={32} className="text-rose-500" />;
    return <Inbox size={32} className="text-slate-400" />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
        {getDefaultIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
