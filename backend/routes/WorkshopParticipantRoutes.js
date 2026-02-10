import express from 'express';
import { getWorkshopParticipants, registerForWorkshop, unregisterFromWorkshop, markParticipantAttended } from '../controllers/WorkshopParticipantController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";

const router = express.Router();

// Req #38 - Professor views workshop participants list and remaining spots
router.get('/:workshopId/participants', protect, requireRole('professor', 'admin', 'eventsoffice'), getWorkshopParticipants);

// Register for workshop
router.post('/:workshopId/register', protect, registerForWorkshop);

// Unregister from workshop
router.delete('/:workshopId/unregister', protect, unregisterFromWorkshop);

// Mark participant as attended
router.put('/:workshopId/participants/:userId/mark-attended', protect, 
    requireRole('professor', 'admin', 'eventsoffice'), markParticipantAttended);

export default router;