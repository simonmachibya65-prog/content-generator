import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] dark:shadow-indigo-500/20',
  secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98]',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98]',
  outline: 'border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  base: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-2xl',
  xl: 'px-9 py-4 text-lg rounded-2xl',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonClasses = `
    inline-flex items-center justify-center gap-2 font-semibold
    transition-all duration-200 cursor-pointer select-none
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4" />
      )}
    </button>
  );
};

export const IconButton = ({
  icon: Icon,
  variant = 'ghost',
  size = 'base',
  loading = false,
  disabled = false,
  onClick,
  ariaLabel,
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    base: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    base: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const isDisabled = disabled || loading;

  const buttonClasses = `
    inline-flex items-center justify-center rounded-xl
    transition-all duration-200 cursor-pointer
    ${variants[variant]}
    ${sizeMap[size]}
    ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={buttonClasses}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 className={`${iconSizeMap[size]} animate-spin`} />
      ) : (
        <Icon className={iconSizeMap[size]} />
      )}
    </button>
  );
};

export const ButtonGroup = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-xl shadow-sm ${className}`} role="group">
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;
        
        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${!isFirst ? '-ml-px' : ''}
            ${isFirst ? 'rounded-r-none' : ''}
            ${isLast ? 'rounded-l-none' : ''}
            ${!isFirst && !isLast ? 'rounded-none' : ''}
          `.trim().replace(/\s+/g, ' ')
        });
      })}
    </div>
  );
};
