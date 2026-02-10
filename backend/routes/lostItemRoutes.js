import express from "express";
import {
  createLostItem,
  getMyLostItems,
  getAllLostItems,
  updateLostItemStatus,
  getStartedEventsForLostFound
} from "../controllers/lostItemController.js";

import { protect } from "../middleware/protect.js";

import { requireRole } from "../middleware/requireRole.js";
import upload from "../config/multerConfig.js";

const router = express.Router();
router.get("/events", protect, getStartedEventsForLostFound);

// 1) Create new lost item
// POST /api/lost-items/event/:eventId
// Allowed: Student, Staff, TA, Professor, Vendor
router.post(
  "/event/:eventId",
  protect,
  requireRole("Student", "Staff", "TA", "Professor", "Vendor"),
  upload.single('photo'), // ← THIS LINE PARSES FormData!
  createLostItem
);

// 2) Get items created BY ME (any logged-in user)
// GET /api/lost-items/my
router.get("/my", protect, getMyLostItems);

// 3) Admin & EventsOffice see ALL lost items
// GET /api/lost-items/all
router.get(
  "/all",
  protect,
  requireRole("Admin", "EventsOffice"),
  getAllLostItems
);

// 4) Admin & EventsOffice can change status (unfound/found)
// PATCH /api/lost-items/:id/status
router.patch(
  "/:id/status",
  protect,
  requireRole("Admin", "EventsOffice", "Vendor"),
  updateLostItemStatus
);

export default router;
