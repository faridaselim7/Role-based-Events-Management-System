import express from "express";
import { 
  assignUserRole, 
  verifyUserAccount, 
  createAdminAccount, 
  deleteAdminAccount,
  getAllAdmins,
  getAdminById,
  updateAdminAccount,
  getAllUsersForEventOffice,
  getEventsAttendanceReport,   // NEW
  getEventsSalesReport,        // NEW
  blockUser,
  unblockUser,
} from "../controllers/AdminController.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();
console.log("✅ AdminRoutes loaded");

// Specific routes first
router.patch("/assign-role", assignUserRole);         // Assign role to user
router.get("/verify/:token", verifyUserAccount);      // Verify user account

// CRUD for Admin/Event Office accounts
router.post("/", createAdminAccount);                 // Create Admin/Event Office
router.get("/admins", getAllAdmins);                  // Get all Admin accounts

// 🔹 ADMIN REPORTS (must be BEFORE the :id route)
router.get("/reports/attendance", getEventsAttendanceReport); // total attendees + filters
router.get("/reports/sales", getEventsSalesReport);           // sales + filters + sort

// Event Office dashboard route
router.get("/allusers", getAllUsersForEventOffice); 
// GET /api/accounts/event-office/users

router.get("/:id", getAdminById);                     // Get by ID
router.put("/:id", updateAdminAccount);               // Update by ID
router.delete("/:id", deleteAdminAccount);            // Delete by ID

// Admin-only: block/unblock users
router.put("/users/:id/block", blockUser);
router.put("/users/:id/unblock", unblockUser);

console.log("✅ Admin routes registered successfully");

export default router;
