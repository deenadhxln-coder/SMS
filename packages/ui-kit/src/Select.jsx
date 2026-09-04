import React from 'react';

const Select = React.forwardRef(({
  label,
  options = [],
  error = null,
  required = false,
  className = '',
  name,
  onChange,
  onBlur,
  value,
  defaultValue,
  placeholder = 'Select an option',
  dark = false,
  children,
  ...rest
}, ref) => {
  const labelClass = dark
    ? "text-xs font-semibold text-slate-300 select-none"
    : "text-xs font-semibold text-slate-700 select-none";

  const defaultBorder = dark
    ? "bg-slate-950 border-slate-800 text-slate-100 focus:ring-purple-500/20 focus:border-purple-500"
    : "bg-white border-slate-200 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500";

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className={labelClass}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all bg-no-repeat appearance-none cursor-pointer ${
          error 
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
            : defaultBorder
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem 1.25rem',
          paddingRight: '2.5rem'
        }}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled className="text-slate-400">
            {placeholder}
          </option>
        )}
        {children ? children : options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs font-semibold text-rose-400 animate-fade-in">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
