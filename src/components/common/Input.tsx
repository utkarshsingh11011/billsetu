import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  required,
  leftAddon,
  rightAddon,
  className = '',
  id,
  ...props
}) => {
  const generatedId = id || (label ? `inp-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={generatedId} className="block text-xs font-semibold text-slate-700 tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-1" title="Required field">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftAddon}
          </div>
        )}
        <input
          id={generatedId}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400 ${
            leftAddon ? 'pl-9' : ''
          } ${rightAddon ? 'pr-10' : ''} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300'
          } ${className}`}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 flex items-center">
            {rightAddon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium mt-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};
