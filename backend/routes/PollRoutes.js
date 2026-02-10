import express from 'express';
import { createPoll, votePoll, getPoll, getAllPolls, closePoll } from '../controllers/PollController.js';
import { requireRole } from '../middleware/requireRole.js';
import { protect } from "../middleware/protect.js";  // ← ADD THIS

const router = express.Router();

// Req #82 - Events Office creates poll for vendor booth setup
router.post('/', protect, requireRole('eventsoffice', 'admin'), createPoll);

// Req #83 - Student/Staff/TA/Professor votes for vendor in poll
router.post('/:pollId/vote', protect, requireRole('student', 'staff', 'ta', 'professor'), votePoll);

// Get single poll
router.get('/:pollId', protect, getPoll);

// Get all polls (with optional filters)
router.get('/', protect, getAllPolls);

// Close poll
router.put('/:pollId/close', protect, requireRole('eventsoffice', 'admin'), closePoll);

export default router;