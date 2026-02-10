import React, { useState, useEffect } from "react";
import ToastNotification from "./ToastNotification";
import useNotifications from "../stores/notifications";

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState([]);

  // When new unread notifications arrive, add them to visible toasts
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Find new notifications that aren't already in visibleToasts
    const newToastIds = unreadNotifications
      .filter(n => !visibleToasts.includes(n.id))
      .map(n => n.id)
      .slice(0, 3 - visibleToasts.length); // Don't exceed 3 toasts

    if (newToastIds.length > 0) {
      setVisibleToasts(prev => [...prev, ...newToastIds].slice(0, 3));
    }
  }, [notifications]); // Remove visibleToasts from dependencies to avoid infinite loop

  // Dismiss toast from view (but keep in notification store if persistent)
  const dismissToast = (id) => {
    setVisibleToasts(prev => prev.filter(toastId => toastId !== id));
  };

  // Get the actual notification objects for visible toasts
  const toastNotifications = visibleToasts
    .map(id => notifications.find(n => n.id === id))
    .filter(Boolean); // Remove any undefined entries

  if (toastNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toastNotifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onClose={removeNotification} // For temporary notifications
          onDismissToast={dismissToast} // For persistent notifications
          autoClose={true}
          autoCloseDuration={5000}
        />
      ))}
    </div>
  );
}