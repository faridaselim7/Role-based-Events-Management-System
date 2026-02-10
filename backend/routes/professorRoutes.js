import express from 'express';
import {
  createWorkshop, 
  listMyWorkshops,
  editWorkshop,
} from '../controllers/professorController.js';

import { Notification } from "../models/Notification.js";
import { protect } from "../middleware/protect.js";
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

//router.post('/workshops', createWorkshop);
router.post(
  '/workshops',
  protect,
  requireRole('professor'),
  createWorkshop
);


router.get('/workshops', protect, requireRole('professor'), listMyWorkshops);
router.patch('/workshops/:id', protect, requireRole('professor'), editWorkshop);

// GET /api/professor/notifications
router.get(
 
  "/notifications",
  protect,
  requireRole('professor'),
  async (req, res) => {
  try {
    // For now, reuse the mock professor ID from createWorkshop if req.user is not set
    const userId = req.user?._id;

    const list = await Notification.find({
      targetUser: userId,
      audienceRole: { $in: ["professor", "all"] },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("workshop", "title startDate status");

    res.json(list);
  } catch (err) {
    console.error("Error fetching professor notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;
