
// frontend/src/pages/vendorRequests.js
import axios from "axios";

// ✅ Centralized Axios instance for all vendor-related API calls
const API = axios.create({
  baseURL: "http://localhost:5001/api/vendors", // matches app.use("/api/vendors", vendorRoutes);
  withCredentials: true,
});

// ✅ Attach token & role before every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Events Office role header (your backend can read this if needed)
  config.headers["x-role"] = "events_office";

  return config;
});

// ✅ GET — unified list of vendor requests (from BazaarApplication + BoothApplication)
// Hits: GET /api/vendors/requests
// Supports filters via query params: type, status, vendorId, eventId, page, limit, sort, etc.
export const listVendorRequests = async (params = {}) => {
  const response = await API.get("/requests", { params });
  return response.data; // backend returns { page, limit, count, data: [...] }
};

// ✅ GET — single unified vendor request by ID
// Hits: GET /api/vendors/requests/:id
export const getVendorRequest = async (id) => {
  const response = await API.get(`/requests/${id}`);
  return response.data; // a single unified object
};

// ✅ PUT — update application status (Accept / Reject) for either bazaar or booth
// Hits: PUT /api/vendors/applications/:id/status
export const updateVendorRequestStatus = async (id, status) => {
  const response = await API.put(`/applications/${id}/status`, { status });
  return response.data; // { message, application }
};