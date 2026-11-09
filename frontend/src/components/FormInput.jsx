import React from 'react';
import { AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

export const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  disabled = false,
  required = false,
  icon: Icon,
  helpText,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const showError = touched && error;

  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    onBlur && onBlur(name);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          className={`
            w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${type === 'password' ? 'pr-11' : ''}
            ${showError
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
            }
            ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-900'}
            text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
            outline-none
          `}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {showError && (
        <div 
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showError && helpText && (
        <p 
          id={`${name}-help`}
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  helpText,
  className = '',
  ...props
}) => {
  const showError = touched && error;

  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    onBlur && onBlur(name);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label 
            htmlFor={name}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? `${name}-error` : helpText ? `${name}-help` : undefined}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none
          ${showError
            ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
            : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
          }
          ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-900'}
          text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
          outline-none
        `}
        {...props}
      />

      {showError && (
        <div 
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showError && helpText && (
        <p 
          id={`${name}-help`}
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options = [],
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  helpText,
  className = '',
  ...props
}) => {
  const showError = touched && error;

  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    onBlur && onBlur(name);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        aria-invalid={showError ? 'true' : 'false'}
        aria-describedby={showError ? `${name}-error` : helpText ? `${name}-help` : undefined}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
          ${showError
            ? 'border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
            : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30'
          }
          ${disabled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-900'}
          text-slate-900 dark:text-white
          outline-none appearance-none cursor-pointer
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {showError && (
        <div 
          id={`${name}-error`}
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!showError && helpText && (
        <p 
          id={`${name}-help`}
          className="text-sm text-slate-500 dark:text-slate-400"
        >
          {helpText}
        </p>
      )}
    </div>
  );
};

export const FormCheckbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  helpText,
  className = '',
  ...props
}) => {
  const handleChange = (e) => {
    onChange(name, e.target.checked);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className={`
            w-5 h-5 rounded border-2 transition-all duration-200
            ${checked 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-transparent' 
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-indigo-400 dark:group-hover:border-indigo-500'}
            peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-100 dark:peer-focus-visible:ring-indigo-900/30
          `}>
            {checked && <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5" />}
          </div>
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            {label}
          </span>
          {helpText && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {helpText}
            </p>
          )}
        </div>
      </label>
    </div>
  );
};
