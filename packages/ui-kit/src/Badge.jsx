import React from 'react';

const variantStyles = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  danger: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500'
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500'
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500'
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400'
  },
  premium: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500'
  }
};

const resolveVariant = (variant, children) => {
  if (variant && variantStyles[variant]) return variant;
  
  const text = typeof children === 'string' ? children.toUpperCase().trim() : '';
  if (text === 'ACTIVE' || text === 'PRESENT' || text === 'PAID') return 'success';
  if (text === 'SUSPENDED' || text === 'ABSENT' || text === 'OVERDUE' || text === 'FAILED') return 'danger';
  if (text === 'PREMIUM') return 'premium';
  if (text === 'STANDARD') return 'info';
  if (text === 'FREE') return 'neutral';
  if (text === 'LATE' || text === 'PARTIAL') return 'warning';

  return 'neutral';
};

const Badge = ({
  children,
  variant,
  dot = false,
  className = ''
}) => {
  const resolved = resolveVariant(variant, children);
  const style = variantStyles[resolved] || variantStyles.neutral;
  const showDot = dot || (typeof children === 'string' && ['ACTIVE', 'SUSPENDED', 'PRESENT', 'ABSENT'].includes(children.toUpperCase().trim()));

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border select-none transition-colors ${style.badge} ${className}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
