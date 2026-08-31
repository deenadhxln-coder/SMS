import React from 'react';

const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder = '',
  error = null,
  required = false,
  className = '',
  name,
  onChange,
  onBlur,
  ...rest
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 select-none">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-slate-400 ${
          error 
            ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
            : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
        }`}
        {...rest}
      />
      {error && (
        <span className="text-xs font-semibold text-red-500 animate-fade-in">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
