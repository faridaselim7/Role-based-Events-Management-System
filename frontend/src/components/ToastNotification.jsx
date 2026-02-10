import React, { useEffect } from "react";

const ToastNotification = ({ 
  notification, 
  onClose,
  onDismissToast, // New prop: just hides the toast without removing from store
  autoClose = true,
  autoCloseDuration = 5000 
}) => {
  const { id, type, message, temporary } = notification;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        // If temporary, remove from store completely
        // If persistent, just dismiss the toast (keep in bell dropdown)
        if (temporary) {
          onClose(id);
        } else if (onDismissToast) {
          onDismissToast(id);
        }
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDuration, id, temporary, onClose, onDismissToast]);

  const handleClose = () => {
    // Manual close: always just dismiss the toast
    // Persistent notifications stay in bell dropdown
    if (temporary) {
      onClose(id);
    } else if (onDismissToast) {
      onDismissToast(id);
    }
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-center gap-4 p-4 rounded-2xl min-w-[420px] max-w-md transform transition-all duration-300 ease-in-out shadow-lg";
    
    switch (type) {
      case "success":
        return `${baseStyles} bg-green-50 border border-green-100`;
      case "warning":
        return `${baseStyles} bg-orange-50 border border-orange-100`;
      case "error":
        return `${baseStyles} bg-red-50 border border-red-100`;
      case "info":
      default:
        return `${baseStyles} bg-blue-50 border border-blue-100`;
    }
  };

  const getIconStyles = () => {
    const baseIconStyles = "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0";
    
    switch (type) {
      case "success":
        return `${baseIconStyles} bg-green-100`;
      case "warning":
        return `${baseIconStyles} bg-orange-100`;
      case "error":
        return `${baseIconStyles} bg-red-100`;
      case "info":
      default:
        return `${baseIconStyles} bg-blue-100`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTypeText = () => {
    switch (type) {
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "error":
        return "Error";
      case "info":
      default:
        return "Info";
    }
  };

  const getTypeSubText = () => {
    switch (type) {
      case "success":
        return "Operation completed successfully";
      case "warning":
        return "Please pay attention";
      case "error":
        return "An error occurred";
      case "info":
      default:
        return "New notification";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-900";
      case "warning":
        return "text-orange-900";
      case "error":
        return "text-red-900";
      case "info":
      default:
        return "text-blue-900";
    }
  };

  const getSubTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "warning":
        return "text-orange-700";
      case "error":
        return "text-red-700";
      case "info":
      default:
        return "text-blue-700";
    }
  };

  const getCloseButtonColor = () => {
    switch (type) {
      case "success":
        return "text-green-400 hover:text-green-600";
      case "warning":
        return "text-orange-400 hover:text-orange-600";
      case "error":
        return "text-red-400 hover:text-red-600";
      case "info":
      default:
        return "text-blue-400 hover:text-blue-600";
    }
  };

  return (
    <div className={getToastStyles()}>
      {/* Icon */}
      <div className={getIconStyles()}>
        {getIcon()}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-base font-bold ${getTextColor()} mb-0.5`}>
          {message || getTypeText()}
        </p>
        <p className={`text-sm ${getSubTextColor()}`}>
          {getTypeSubText()}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${getCloseButtonColor()} transition-colors duration-200 p-1 hover:bg-white/50 rounded-lg`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ToastNotification;