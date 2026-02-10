import { Router } from "express";

import mongoose from "mongoose";
import { Workshop } from "../models/Workshop.js";

import {
  acceptAndPublishWorkshop,
  rejectWorkshop,
  requestWorkshopEdits,
  deleteWorkshop,
  updateWorkshopRestrictions,   // ✅ add this
} from "../controllers/EO_workshopController.js";


import requireEO from "../middleware/requireEventsOffice.js";
import requireEventsOffice from "../middleware/requireEventsOffice.js";

const router = Router();

/**
 * TEST helper (create a pending workshop)
 * POST /api/eo/workshops
 * Body: { title, description, professor, location, startDate, endDate }
 */
router.post("/workshops", async (req, res) => {
  try {
    const now = new Date();
    const start = req.body.startDate ? new Date(req.body.startDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const end = req.body.endDate ? new Date(req.body.endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000); // start +1 day
    const regDeadline = req.body.registrationDeadline
      ? new Date(req.body.registrationDeadline)
      : new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000); // start -7 days

    const doc = await Workshop.create({
      // Defaults that satisfy the unified schema (you can override via req.body)
      title: req.body.title || "Test Workshop",
      description: req.body.description || "",
      shortDescription: req.body.shortDescription || "",
      fullAgenda: req.body.fullAgenda || "",

      location: req.body.location || "GUC Cairo", // enum
      startDate: start,
      endDate: end,

      facultyResponsible: req.body.facultyResponsible || "MET", // enum
      requiredBudget: req.body.requiredBudget ?? 1000,
      fundingSource: req.body.fundingSource || "GUC", // enum
      extraRequiredResources: req.body.extraRequiredResources || "",
      capacity: req.body.capacity ?? 10,
      registrationDeadline: regDeadline,

      // Ownership: use logged-in user if present; otherwise a dummy ObjectId for testing
      createdBy: req.user?._id || new mongoose.Types.ObjectId(),

      // Initial EO workflow state
      status: "pending",
      eoNotes: "",
      published: false,
      publishedAt: undefined,

      // Optional arrays/refs
      professorsParticipating: req.body.professorsParticipating || [],
      acceptedVendors: [],
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "Invalid workshop data", error: e.message });
  }
});

// EO list all workshops
// GET /api/eo/workshops
router.get("/workshops", requireEventsOffice, async (_req, res) => {
  const list = await Workshop.find().sort({ createdAt: -1 });
  res.json(list);
});

router.get("/workshops/published", async (_req, res) => {
  const items = await Workshop.find({ published: true }).sort({ startDate: 1 });
  res.json(items);
});

/**
 * Accept & publish a professor workshop
 * PATCH /api/eo/workshops/:id/accept
router.post("/workshops", requireEO, /* handler */
router.get("/workshops/published", requireEO, /* handler */);
router.patch("/workshops/:id/accept", requireEO, acceptAndPublishWorkshop);
router.patch("/workshops/:id/reject", requireEO, rejectWorkshop);
router.patch("/workshops/:id/request-edits", requireEO, requestWorkshopEdits);

// ✅ NEW: Delete workshop route
router.delete("/workshops/:id", requireEO, deleteWorkshop);
router.patch(
  "/workshops/:id/restrictions",
  requireEO,
  updateWorkshopRestrictions
);


export default router;

