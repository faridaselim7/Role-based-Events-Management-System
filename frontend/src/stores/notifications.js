import { create } from "zustand";
import axios from "axios";

const useNotifications = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,

  /* =========================
     BACKEND INTEGRATION
  ========================== */

  // Fetch notifications for the logged-in user (Professor / Student / etc.)
  fetchNotifications: async () => {
    try {
      set({ isLoading: true, error: null });

      const token = localStorage.getItem("token");

      const res = await axios.get("/api/notifications/my", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Backend may return { notifications: [...] } or just [...]
      const raw = res.data.notifications || res.data || [];

      const mapped = raw.map((n) => ({
        ...n,
        id: n._id || n.id, // normalize id for frontend
      }));

      set({ notifications: mapped, isLoading: false });
    } catch (err) {
      console.error("Error fetching notifications", err);
      set({
        isLoading: false,
        error: err.response?.data?.message || err.message || "Error fetching notifications",
      });
    }
  },

  // Mark ONE notification as read (updates backend + local state)
  markAsRead: async (id) => {
    // optimistic UI update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id || n._id === id ? { ...n, read: true } : n
      ),
    }));

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/notifications/${id}/read`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
    }
  },

  // Mark ALL as read (backend optional – adjust if you have an endpoint)
  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));

    try {
      const token = localStorage.getItem("token");
      // if you have this route, keep it – if not, you can remove this block
      await axios.put(
        "/api/notifications/mark-all-read",
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
    } catch (err) {
      console.error("Error marking all notifications as read", err);
    }
  },

  /* =========================
     LOCAL HELPERS (TOAST-LIKE)
  ========================== */

  addNotification: (notification) => {
    const newNotification = {
      // Default values first
      id: notification.id || Date.now().toString(),
      type: notification.type || "info", // 'info', 'success', 'warning', 'error'
      read: false,
      createdAt: new Date().toISOString(),
      temporary: false, // Default to false (persists in bell dropdown)
      
      // Then spread all incoming properties (this will override defaults if provided)
      ...notification,
      
      // Ensure message is included
      message: notification.message,
    };

    set((state) => {
      // Check if notification with this ID already exists
      const exists = state.notifications.some(
        n => n.id === newNotification.id || n._id === newNotification.id
      );
      
      // If it exists, don't add it again
      if (exists) {
        return state;
      }

      // Add new notification
      return {
        notifications: [newNotification, ...state.notifications].slice(0, 50), // Limit to 50
      };
    });
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (n) => n.id !== id && n._id !== id
      ),
    })),

  clearAll: () => set({ notifications: [] }),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  // Quick helpers for toast-only notifications (temporary: true)
  addSuccess: (message, temporary = true) => {
    get().addNotification({ type: "success", message, temporary });
  },

  addError: (message, temporary = true) => {
    get().addNotification({ type: "error", message, temporary });
  },

  addWarning: (message, temporary = true) => {
    get().addNotification({ type: "warning", message, temporary });
  },

  addInfo: (message, temporary = true) => {
    get().addNotification({ type: "info", message, temporary });
  },
}));

export default useNotifications;