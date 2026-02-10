import express from 'express';
import { 
  cancelGymSession, 
  editGymSession, 
  getGymSession, 
  getAllGymSessions,  
  createGymSession,
  registerForSession
} from '../controllers/GymController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Register for gym session - MUST BE BEFORE POST / (Req #81)
router.post("/register", protect, registerForSession);

// Get all gym sessions
router.get('/', protect, getAllGymSessions);

// Get single gym session
router.get('/:sessionId', protect, getGymSession);

// ============================================================================
// EVENTS OFFICE / ADMIN ONLY ROUTES
// ============================================================================

// Create new gym session - MUST BE AFTER POST /register
router.post('/', protect, requireRole('eventsoffice', 'EventsOffice', 'admin'), createGymSession);

// Cancel gym session (Req #85)
router.post('/:sessionId/cancel', protect, requireRole('eventsoffice', 'EventsOffice', 'admin'), cancelGymSession);

// Edit gym session (Req #86)
router.put('/:sessionId/edit', protect, requireRole('eventsoffice', 'EventsOffice', 'admin'), editGymSession);

export default router;