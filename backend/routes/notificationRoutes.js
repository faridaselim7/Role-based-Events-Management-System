import express from "express";
import { Notification } from "../models/Notification.js";
import { requireRole } from "../middleware/requireRole.js";

import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { notifyEventReminder } from "../controllers/notifyController.js";

import Bazaar from "../models/Bazaar.js";
import Trip from "../models/Trip.js";
import { Workshop } from "../models/Workshop.js";
import { GymSession } from "../models/GymSession.js";

import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}



// RUN REMINDERS (1 day & 1 hour)
// RUN REMINDERS (1 day & 1 hour) for ALL registered events
async function runEventReminders() {
  const nowMs = Date.now();

  //const ONE_HOUR = 60 * 60 * 1000;
  //const ONE_DAY = 24 * ONE_HOUR;
  const WINDOW = 5 * 60 * 1000; // +/- 5 minutes


  const ONE_HOUR = 1 * 60 * 1000;  // 1 minute
  const ONE_DAY  = 2 * 60 * 1000;  // 2 minutes


  function timeWindow(offsetMs) {
    return {
      start: new Date(nowMs + offsetMs - WINDOW),
      end: new Date(nowMs + offsetMs + WINDOW),
    };
  }

  const win1d = timeWindow(ONE_DAY);
  const win1h = timeWindow(ONE_HOUR);

  /**
   * Generic helper:
   * - model: Mongoose model (Event, Workshop, Trip, Bazaar, GymSession)
   * - eventType: registration.eventType value (conference, workshop, trip, bazaar, gym)
   * - dateField: field name that holds the start datetime
   * - titleField: best field to use as title (fallback to .title/.name)
   */
  async function processType({ model, eventType, dateField, titleField }) {
    // 1 day window
    const events1d = await model
      .find({ [dateField]: { $gte: win1d.start, $lte: win1d.end } })
      .lean();

    // 1 hour window
    const events1h = await model
      .find({ [dateField]: { $gte: win1h.start, $lte: win1h.end } })
      .lean();

    async function sendFor(events, when) {
      if (!events.length) return;

      const ids = events.map((e) => e._id);

      // 🔹 your schema: eventId, userId, eventType, status
      const regs = await Registration.find({
        eventId: { $in: ids },
        eventType,
        status: "registered",
      }).lean();

      for (const reg of regs) {
        const ev = events.find(
          (e) => String(e._id) === String(reg.eventId)
        );
        if (!ev) continue;

        const title =
          ev[titleField] || ev.title || ev.name || "Event";

        const date =
          ev[dateField] ||
          ev.date ||
          null;

        if (!date) continue; // can't schedule reminder without a date

        await notifyEventReminder({
          event: { title, date },
          userId: reg.userId,
          when,
          eventId: ev._id,
          eventType,
        });
      }
    }

    await sendFor(events1d, "1d");
    await sendFor(events1h, "1h");
  }

  // ⚠️ If any of these date fields differ in your schemas,
  // just change the `dateField` string for that type.
  await Promise.all([
    // Conferences (EO Event)
    processType({
      model: Event,
      eventType: "conference",
      dateField: "date",       // Event.date
      titleField: "title",
    }),
    // Workshops
    processType({
      model: Workshop,
      eventType: "workshop",
      dateField: "startDate",  // Workshop.startDate
      titleField: "title",
    }),
    // Trips
    processType({
      model: Trip,
      eventType: "trip",
      dateField: "startDateTime", // 🔁 change if your Trip schema uses a different field
      titleField: "name",
    }),
    // Bazaars
    processType({
      model: Bazaar,
      eventType: "bazaar",
      dateField: "startDateTime", // we saw this used in populate(...) earlier
      titleField: "name",
    }),
    // Gym sessions
    processType({
      model: GymSession,
      eventType: "gym",
      dateField: "date", // or "startDateTime" depending on your schema
      titleField: "title",
    }),
  ]);
}



const router = express.Router();

const allowAll = requireRole(
  "student",
  "staff",
  "ta",
  "professor",
  "events_office",
  "admin"
);

router.get("/notifications", allowAll, async (req, res) => {
  try {
    const roleHeader = (req.get("x-role") || "")
      .toLowerCase()
      .split(",")[0]
      .trim();

    const audienceConditions = [
      { audienceRole: "all" },
      { audienceRole: roleHeader },
    ];

    // try both _id and id, depending on how requireRole attaches user
    const userId =
      req.user?._id || req.user?.id || null;

    const orClauses = [
      // 🔹 Global event-created notifications for everyone with that role
      {
        type: "event_created",
        $or: audienceConditions,
      },
    ];

    if (userId) {
      // 🔹 Personal reminders for this specific user
      orClauses.push({
        type: { $in: ["event_reminder_1d", "event_reminder_1h"] },
        targetUser: userId,
      });
    }

    const list = await Notification.find({ $or: orClauses })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(list);
  } catch (err) {
    console.error("GET /notifications error:", err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
});

router.get("/notifications/pending-vendors", async (req, res) => {
  try {
    const notifications = await Notification.find({
      type: "vendor_request_pending",  // ✅ This matches your schema enum
      $or: [
        { audienceRole: "events_office" },
        { audienceRole: "admin" }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching pending vendor notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});



router.post(
  "/reminders/run",
  requireRole("admin", "events_office"),
  async (req, res) => {
    try {
      await runEventReminders();
      res.json({ ok: true, message: "Reminders processed" });
    } catch (err) {
      console.error("POST /reminders/run error:", err);
      res.status(500).json({ message: "Failed to run reminders" });
    }
  }
);

// Simple test email route (no role check for now while testing)
router.post("/notifications/test-email", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Please provide 'to' in body" });
    }

    if (!process.env.OUTLOOK_USER) {
      return res.status(500).json({ message: "OUTLOOK_USER is not set" });
    }

    const msg = {
      to,
      from: process.env.OUTLOOK_USER,
      subject: "Test email from Brains704 backend",
      html: `
        <p>Hi,</p>
        <p>This is a <strong>test email</strong> from your Brains704 backend 🎉</p>
        <p>If you see this, SENDGRID + .env setup is working correctly.</p>
      `,
    };

    await sgMail.send(msg);
    res.json({ message: "Test email sent", to });
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ message: "Failed to send test email", error: err.message });
  }
});



export default router;
