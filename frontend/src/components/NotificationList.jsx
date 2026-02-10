import React from "react";
import useNotifications from "../stores/notifications";

export default function NotificationList() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();

  // Filter out temporary notifications (toast-only messages like login success)
  const persistentNotifications = notifications.filter(n => !n.temporary);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "warning":
        return (
          <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case "error":
        return (
          <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationStyle = (type) => {
    const baseStyle = "flex items-start gap-3 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer";
    
    switch (type) {
      case "success":
        return `${baseStyle} bg-green-50 border-green-400 text-green-800`;
      case "warning":
        return `${baseStyle} bg-orange-50 border-orange-400 text-orange-800`;
      case "error":
        return `${baseStyle} bg-red-50 border-red-400 text-red-800`;
      case "info":
      default:
        return `${baseStyle} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const unreadCount = persistentNotifications.filter(n => !n.read).length;

  if (persistentNotifications.length === 0) {
    return (
      <div className="w-80 max-h-96 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔔</div>
          <p>No notifications</p>
          <p className="text-sm text-gray-400">You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 max-h-96 overflow-hidden flex flex-col bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={clearAll}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {persistentNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`${getNotificationStyle(notification.type)} ${
                notification.read ? "opacity-60" : "opacity-100"
              }`}
            >
              {/* Icon */}
              {getNotificationIcon(notification.type)}
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {/* Unread indicator */}
              {!notification.read && (
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
        </p>
      </div>
    </div>
  );
}