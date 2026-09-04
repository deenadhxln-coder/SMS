import React from 'react';

const StatMetricCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  variant = 'default',
  badge,
  onClick
}) => {
  const variantStyles = {
    default: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
    },
    primary: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
    success: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-rose-50 text-rose-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      onClick={onClick}
      className={`${style.bg} rounded-xl p-5 border ${style.border} shadow-sm transition-all text-left ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {value}
            </h3>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {subtext && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="truncate">{subtext}</span>
          {trend && (
            <span className="font-semibold text-slate-700">{trend}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatMetricCard;
