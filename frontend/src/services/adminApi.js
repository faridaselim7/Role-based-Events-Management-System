import { api } from "../lib/api";

// List all admins
export async function fetchAdmins() {
  const { data } = await api.get("/admin/admins");
  return data.admins; // returns array
}

// Create admin
export async function createAdmin(payload) {
  try {
    // Log payload to catch any undefined fields
    console.log("Creating admin with payload:", payload);

    // Make sure all required fields exist
    const { firstName, lastName, email, password, role } = payload;
    if (!firstName || !lastName || !email || !password || !role) {
      throw new Error("All fields are required");
    }

    // POST request to backend
    const { data } = await api.post(
      "/admin", // if your Express is mounted on /api/admin, your api instance should include the /api prefix
      { firstName, lastName, email, password, role },
      {
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true // if your backend uses cookies/auth
      }
    );

    console.log("Admin created:", data);
    return data.admin;
  } catch (error) {
    console.error("createAdmin failed:", error.response?.data || error.message);
    throw error;
  }
}

// Delete admin
export async function deleteAdmin(id) {
  const { data } = await api.delete(`/admin/${id}`);
  return data;
}

// Fetch all users (Event Office view)
// src/services/adminApi.js (or wherever you put API calls)
export async function fetchAllUsers() {
  const { data } = await api.get("/admin/allusers");
  return Array.isArray(data.users) ? data.users : [];
}

// Assign a role to a user awaiting verification
// Accepts either a user object (with _id/id) or a string id
export async function assignUserRole(userOrId, role) {
  const userId =
    typeof userOrId === "string"
      ? userOrId
      : userOrId?._id ?? userOrId?.id ?? "";

  const payload = {
    userId: String(userId).trim(),
    role: typeof role === "string" ? role.trim() : role,
  };

  if (!payload.userId) {
    throw new Error("assignUserRole: 'userId' is required (string or user object)");
  }
  if (!payload.role) {
    throw new Error("assignUserRole: 'role' is required");
  }

  const { data } = await api.patch("/admin/assign-role", payload,
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );
  return data; // { user, message }
}

// Fetch all events (for admin view)
export async function fetchAllEvents(params = {}) {
  // params can include filters like type, date, etc.
  const { data } = await api.get("/events/upcoming", { params });
  return data; // { count, events }
}

// Fetch a single event by ID
export async function fetchEventById(id) {
  const { data } = await api.get(`/events/${id}`);
  return data;
}

// Fetch admin by ID
export async function fetchAdminById(id) {
  const { data } = await api.get(`/admin/${id}`);
  return data;
}

// Update admin
// Update admin
export async function updateAdmin(id, payload) {
  const { data } = await api.put(`/admin/${id}`, payload);
  return data;
}
// src/services/adminApi.js

export async function blockUser(userId) {
  const { data } = await api.put(`/admin/users/${userId}/block`); // ✅ include /admin
  return data.user;
}

export async function unblockUser(userId) {
  const { data } = await api.put(`/admin/users/${userId}/unblock`); // ✅ include /admin
  return data.user;
}