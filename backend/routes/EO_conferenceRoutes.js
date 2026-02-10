import { Router } from "express";

import { 
  createConference, 
  listConferences, 
  getConference, 
  updateConference,   // ✅ already existed for edit
  deleteConference    // ✅ added import for delete
} from "../controllers/EO_conferenceController.js";

const router = Router();

// Create conference (EO)
router.post("/conferences", createConference);

// Optional helpers
router.get("/conferences", listConferences);
router.get("/conferences/:id", getConference);

// ✅ Route to edit existing conference
router.put("/conferences/:id", updateConference);

// ✅ New route to delete a conference
router.delete("/conferences/:id", deleteConference);

export default router;