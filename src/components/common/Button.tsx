import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none';
  
  const variantStyles = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500 shadow-sm border border-transparent',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-700 shadow-sm border border-transparent',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-teal-500 shadow-xs',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400 border border-transparent',
  };

  // Generous tap target heights for mobile touch usability (PRD Section 2 & 4)
  const sizeStyles = {
    sm: 'text-xs h-9 px-3 gap-1.5',
    md: 'text-sm h-11 px-4 gap-2 min-h-[44px]',
    lg: 'text-base h-12 px-6 gap-2.5 min-h-[48px]',
  };

  const disabledStyles = 'opacity-60 cursor-not-allowed active:scale-100';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled || isLoading ? disabledStyles : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
