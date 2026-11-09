import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastStyles = {
  success: {
    icon: CheckCircle2,
    className: 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400'
  }
};

const createToast = (type, message, options = {}) => {
  const { icon: Icon, className, iconColor } = toastStyles[type];
  
  return toast.custom(
    (t) => (
      <div
        className={`
          ${t.visible ? 'animate-fade-in' : 'animate-fade-out'}
          max-w-md w-full shadow-lg rounded-xl border-2 p-4
          ${className}
        `}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
          <div className="flex-1">
            <p className="font-medium text-sm">{message}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    ),
    {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options
    }
  );
};

export const showToast = {
  success: (message, options) => createToast('success', message, options),
  error: (message, options) => createToast('error', message, options),
  info: (message, options) => createToast('info', message, options),
  warning: (message, options) => createToast('warning', message, options),
  
  promise: (promise, messages, options) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong'
      },
      {
        success: {
          icon: '✅',
        },
        error: {
          icon: '❌',
        },
        ...options
      }
    );
  }
};

// API error handler
export const handleApiError = (error, customMessage) => {
  console.error('API Error:', error);
  
  let message = customMessage || 'An error occurred';
  
  if (error.response) {
    // Server responded with error
    message = error.response.data?.message || error.response.data?.error || message;
  } else if (error.request) {
    // Request made but no response
    message = 'No response from server. Please check your connection.';
  } else {
    // Something else happened
    message = error.message || message;
  }
  
  showToast.error(message);
  return message;
};
