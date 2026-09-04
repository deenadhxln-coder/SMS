import React from 'react';

const colorStyles = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'ring-slate-200' },
};

const StatCard = ({
  title,
  value,
  icon = null,
  color = 'indigo',
  subtitle = '',
  loading = false,
  onClick = null,
  className = ''
}) => {
  const activeColor = colorStyles[color] || colorStyles.indigo;

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse flex items-center gap-5 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-slate-100"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-20 bg-slate-100 rounded"></div>
          <div className="h-6 w-16 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 transition-all text-left ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 active:scale-99' : 'hover:shadow-md'
      } ${className}`}
    >
      {icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${activeColor.bg} ${activeColor.text}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
          {title}
        </p>
        <h3 className="text-xl font-black text-slate-800 leading-none truncate">
          {value}
        </h3>
        {subtitle && (
          <p className="text-3xs text-slate-400 font-medium mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
