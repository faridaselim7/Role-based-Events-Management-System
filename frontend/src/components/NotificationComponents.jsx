// NotificationComponents.jsx - All notification components in one file
import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBell,
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle,
  faTriangleExclamation,
  faUser,
  faCalendar,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import useNotifications from "../stores/notifications";

// ==================== STYLES ====================
const styles = `
/* NotificationBell */
.notification-bell {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.notification-bell:hover {
  background: rgba(0, 0, 0, 0.05);
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 12px;
  padding: 2px 6px;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* NotificationDropdown */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 420px;
  max-width: calc(100vw - 32px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.notification-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.notification-dropdown-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}

.mark-all-read-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.mark-all-read-btn:hover {
  background: #eff6ff;
  color: #2563eb;
}

.notification-dropdown-body {
  max-height: 480px;
  overflow-y: auto;
}

/* NotificationList */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 400px;
  overflow-y: auto;
}

.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f1f5f9;
  position: relative;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #eff6ff;
}

.notification-item.unread:hover {
  background: #dbeafe;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: currentColor;
  color: white;
  opacity: 0.15;
  flex-shrink: 0;
  position: relative;
}

.notification-icon svg {
  position: relative;
  z-index: 1;
  opacity: 1;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 8px;
}

.notification-type {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.notification-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}

.notification-message {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  flex-shrink: 0;
  margin-top: 4px;
}

.notification-empty {
  padding: 60px 40px;
  text-align: center;
  color: #94a3b8;
}

.notification-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.notification-empty p {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
}

.notification-empty span {
  font-size: 14px;
  color: #94a3b8;
}

/* Toast */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 300px;
  max-width: 500px;
  animation: toastIn 0.3s ease-out;
  border-left: 4px solid currentColor;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

.toast-success { color: #10b981; }
.toast-error { color: #ef4444; }
.toast-warning { color: #f59e0b; }
.toast-info { color: #3b82f6; }

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  color: currentColor;
}

.toast-message {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.5;
  font-weight: 500;
}

.toast-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: #f1f5f9;
  color: #64748b;
}

/* Banner */
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  border-left: 4px solid currentColor;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: bannerSlide 0.3s ease-out;
}

@keyframes bannerSlide {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.banner-vendor {
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  color: #7c3aed;
  border-color: #7c3aed;
}

.banner-event {
  background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
  color: #d946ef;
  border-color: #d946ef;
}

.banner-alert {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border-color: #d97706;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.banner-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: currentColor;
  color: white;
  flex-shrink: 0;
}

.banner-text h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: currentColor;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 16px;
}

.banner-action-btn {
  padding: 8px 16px;
  background: currentColor;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.banner-action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.banner-close {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
}

.banner-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 640px) {
  .notification-dropdown {
    width: calc(100vw - 32px);
    right: 16px;
  }
  .toast-container {
    right: 16px;
    left: 16px;
  }
  .toast {
    min-width: unset;
    width: 100%;
  }
  .banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .banner-actions {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'notification-components-styles';
  if (!document.getElementById(styleId)) {
    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }
}

// ==================== COMPONENTS ====================

// Notification Bell Component
export function NotificationBell({ onClick }) {
  const notifications = useNotifications((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-bell" onClick={onClick}>
      <FontAwesomeIcon icon={faBell} size="lg" />
      {unread > 0 && (
        <span className="notification-badge">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </div>
  );
}

// Notification Icon Component
function NotificationIcon({ type }) {
  const iconMap = {
    success: { icon: faCheckCircle, color: "#10b981" },
    error: { icon: faExclamationCircle, color: "#ef4444" },
    warning: { icon: faTriangleExclamation, color: "#f59e0b" },
    info: { icon: faInfoCircle, color: "#3b82f6" },
    vendor: { icon: faUser, color: "#8b5cf6" },
    event: { icon: faCalendar, color: "#ec4899" },
    default: { icon: faBell, color: "#6b7280" }
  };

  const { icon, color } = iconMap[type] || iconMap.default;
  
  return (
    <div className="notification-icon" style={{ color }}>
      <FontAwesomeIcon icon={icon} />
    </div>
  );
}

// Format Time Helper
function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return time.toLocaleDateString();
}

// Notification List Component
export function NotificationList() {
  const notifications = useNotifications((s) => s.notifications);
  const markAsRead = useNotifications((s) => s.markAsRead);

  if (notifications.length === 0) {
    return (
      <div className="notification-empty">
        <div className="notification-empty-icon">
          <FontAwesomeIcon icon={faBell} />
        </div>
        <p>No notifications yet</p>
        <span>We'll notify you when something arrives</span>
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => markAsRead(n.id)}
          className={`notification-item ${!n.read ? "unread" : ""}`}
        >
          <NotificationIcon type={n.type} />
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-type">{n.type}</span>
              {n.timestamp && (
                <span className="notification-time">
                  {formatTime(n.timestamp)}
                </span>
              )}
            </div>
            <p className="notification-message">{n.message}</p>
          </div>
          {!n.read && <div className="notification-dot" />}
        </div>
      ))}
    </div>
  );
}

// Notification Dropdown Component
export function NotificationDropdown({ isOpen, onClose, anchorRef }) {
  const dropdownRef = useRef(null);
  const markAllAsRead = useNotifications((s) => s.markAllAsRead);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-dropdown-header">
        <h3>Notifications</h3>
        {markAllAsRead && (
          <button 
            className="mark-all-read-btn"
            onClick={() => markAllAsRead()}
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="notification-dropdown-body">
        <NotificationList />
      </div>
    </div>
  );
}

// Toast Component
export function Toast({ id, type, message, duration = 5000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const toastConfig = {
    success: { icon: faCheckCircle, className: "toast-success" },
    error: { icon: faExclamationCircle, className: "toast-error" },
    warning: { icon: faTriangleExclamation, className: "toast-warning" },
    info: { icon: faInfoCircle, className: "toast-info" }
  };

  const config = toastConfig[type] || toastConfig.info;

  return (
    <div className={`toast ${config.className}`}>
      <div className="toast-icon">
        <FontAwesomeIcon icon={config.icon} />
      </div>
      <p className="toast-message">{message}</p>
      <button className="toast-close" onClick={() => onClose(id)}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

// Banner Component
export function Banner({ type, message, onClose, actionButton, onAction }) {
  const bannerConfig = {
    vendor: { 
      icon: faUser, 
      className: "banner-vendor",
      title: "New Vendor Request"
    },
    event: { 
      icon: faCalendar, 
      className: "banner-event",
      title: "Event Update"
    },
    alert: { 
      icon: faExclamationCircle, 
      className: "banner-alert",
      title: "Alert"
    }
  };

  const config = bannerConfig[type] || bannerConfig.alert;

  return (
    <div className={`banner ${config.className}`}>
      <div className="banner-content">
        <div className="banner-icon">
          <FontAwesomeIcon icon={config.icon} />
        </div>
        <div className="banner-text">
          <h4>{config.title}</h4>
          <p>{message}</p>
        </div>
      </div>
      <div className="banner-actions">
        {actionButton && (
          <button className="banner-action-btn" onClick={onAction}>
            {actionButton}
          </button>
        )}
        {onClose && (
          <button className="banner-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>
    </div>
  );
}