import React, { useId } from 'react';

const Input = React.forwardRef(({
  id: explicitId,
  label,
  type = 'text',
  placeholder = '',
  error = null,
  required = false,
  className = '',
  name,
  onChange,
  onBlur,
  dark = false,
  ...rest
}, ref) => {
  const generatedId = useId();
  const inputId = explicitId || (name ? `input-${name}` : `input-${generatedId}`);
  const errorId = `${inputId}-error`;

  const labelClass = dark
    ? "text-xs font-semibold text-slate-300 select-none"
    : "text-xs font-semibold text-slate-700 select-none";

  const defaultBorder = dark
    ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 focus:ring-purple-500/20 focus:border-purple-500"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-500";

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
          error 
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
            : defaultBorder
        }`}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="text-xs font-semibold text-rose-400 animate-fade-in">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

