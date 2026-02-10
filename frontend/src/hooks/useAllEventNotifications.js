// frontend/src/hooks/useAllEventNotifications.js
import { useEffect } from "react";
import useNotifications from "../stores/notifications";

export default function useAllEventNotifications(roleKey = "generic") {
  const { addNotification } = useNotifications();

  useEffect(() => {
    let cancelled = false;

    const fetchAllEvents = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/events/upcoming");
        if (!res.ok) {
          console.error("Failed to load events for notifications", await res.text());
          return;
        }

        const data = await res.json();
        const events = data.events || data || [];

        if (cancelled) return;

        events.forEach((evt) => {
          if (!evt || !evt._id) return;

          const title = evt.name || evt.title || "Event";
          const dateStr = evt.date || evt.startDate;
          const formattedDate = dateStr
            ? new Date(dateStr).toLocaleString()
            : "date TBA";

          // id is scoped by role so each role can have its own notification list
          addNotification({
            id: `event-${roleKey}-${evt._id}`,
            type: "info",
            message: `📢 Event: "${title}" on ${formattedDate}`,
            read: false,
            createdAt: evt.createdAt || new Date().toISOString(),
          });
        });
      } catch (err) {
        console.error("fetchAllEvents error", err);
      }
    };

    // run once when dashboard mounts
    fetchAllEvents();

    // still keep polling if you want them to see events added while the dashboard is open
    const interval = setInterval(fetchAllEvents, 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roleKey, addNotification]);
}
