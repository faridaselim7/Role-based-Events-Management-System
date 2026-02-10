import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import useNotifications from "../stores/notifications";

export default function NotificationBell({ onClick }) {
  const notifications = useNotifications((s) => s.notifications);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Filter out temporary notifications (toast-only) and count only unread persistent ones
  const unread = notifications.filter((n) => !n.read && !n.temporary).length;

  // Trigger animation when new notification arrives
  useEffect(() => {
    if (unread > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [notifications.length]); // Trigger on new notifications

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-12deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          70% { transform: rotate(6deg); }
          80% { transform: rotate(-4deg); }
          90% { transform: rotate(2deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes badgePulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        .bell-animate {
          animation: bellRing 0.8s ease-in-out;
        }

        .badge-pulse {
          animation: badgePulse 0.6s ease-in-out 2;
        }
      `}</style>

      <div 
        className={`relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 ${
          isAnimating ? 'bell-animate' : ''
        }`}
        onClick={onClick}
      >
        <FontAwesomeIcon 
          icon={faBell} 
          className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
          size="lg" 
        />

        {unread > 0 && (
          <span
            className={`absolute top-0 right-0 bg-red-500 text-white rounded-full min-w-5 h-5 flex items-center justify-center text-xs font-medium px-1 ${
              isAnimating ? 'badge-pulse' : ''
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
    </>
  );
}