import express from "express";
import { Notification } from "../models/Notification.js";
import requireEventsOffice from "../middleware/requireEventsOffice.js";

const router = express.Router();

// List notifications for Events Office
router.get("/notifications", requireEventsOffice, async (req, res) => {
  const list = await Notification.find({
     audienceRole: { $in: ["events_office", "all"] }
  })

    .sort({ createdAt: -1 })
    .limit(100)
    .populate("workshop", "title startDate");
  res.json(list);
});

// Mark one as read
router.patch("/notifications/:id/read", requireEventsOffice, async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id },
    { $addToSet: { readBy: req.user._id } }
  );
  res.json({ ok: true });
});

// Mark all as read
router.patch("/notifications/read-all", requireEventsOffice, async (req, res) => {
  await Notification.updateMany(
    { audienceRole: "events_office" },
    { $addToSet: { readBy: req.user._id } }
  );
  res.json({ ok: true });
});

export default router;
