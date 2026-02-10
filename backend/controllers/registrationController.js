// backend/controllers/registrationController.js
import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { addEventToGoogleCalendar } from "../utils/googleCalendarService.js";

// =============================
// Register a new user (Student/Staff/TA/Professor)
// =============================
export const registerUser = async (req, res) => {
  const { name, email, userId, role } = req.body;

  if (!name || !email || !userId || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["Student", "Staff", "TA", "Professor"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { userId }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "Email or User ID already exists" });
    }

    const user = new User({ name, email, userId, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("[registerUser] Server error:", err);
    res
      .status(500)
      .json({ error: "Server error", details: err.message });
  }
};

// =============================
// Create an event (Workshop/Trip) - for testing
// =============================
export const createEvent = async (req, res) => {
  const { name, type, date } = req.body;

  if (!name || !type || !date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["Workshop", "Trip"].includes(type)) {
    return res.status(400).json({ error: "Invalid event type" });
  }

  try {
    const event = new Event({ name, type, date: new Date(date) });
    await event.save();
    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    console.error("[createEvent] Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// =============================
// Register user for a workshop/trip
// =============================
export const registerForEvent = async (req, res) => {
  const { userId, eventId, googleAccessToken } = req.body;

  if (!userId || !eventId) {
    return res
      .status(400)
      .json({ error: "userId and eventId are required" });
  }

  try {
    // 1) Load user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2) Load event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 3) NEW: Restriction check based on event.allowedUserTypes
    // If allowedUserTypes has values → ONLY those roles may register
    const allowed = Array.isArray(event.allowedUserTypes)
      ? event.allowedUserTypes
      : [];

    if (allowed.length > 0) {
      const normalizedAllowed = allowed.map((r) =>
        String(r).toLowerCase()
      );
      const userRoleNorm = String(user.role || "").toLowerCase();

      // Helpful debug log (you'll see this in the backend console)
      console.log("[registerForEvent] role check:", {
        eventId: event._id.toString(),
        eventName: event.title || event.name || "<no title>",
        allowedUserTypes: allowed,
        userRole: user.role,
        normalizedAllowed,
        userRoleNorm,
      });

      if (!normalizedAllowed.includes(userRoleNorm)) {
        return res.status(403).json({
          error: `This event is only available for: ${allowed.join(
            ", "
          )}`,
        });
      }
    }

    // 4) Check if already registered
    const existing = await Registration.findOne({
      user: userId,
      event: eventId,
    });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Already registered for this event" });
    }

    // 5) Create registration
    const registration = new Registration({ user: userId, event: eventId });
    await registration.save();

    // 6) Optionally attempt to add to Google Calendar if client provided an access token
    //    We intentionally do this after registration succeeds so registration isn't rolled back
    //    if calendar insertion fails.
    let calendarResult = null;
    if (googleAccessToken) {
      try {
        // build event payload expected by googleCalendarService
        const start = event.date ? new Date(event.date) : null;
        const duration = event.durationMins || 60;
        const end = start ? new Date(start.getTime() + duration * 60000) : null;

        const calendarEvent = {
          title: event.title || event.name || "Event",
          description: event.description || event.conference?.description || "",
          location: event.conference?.location || event.location || "",
          startDate: start ? start.toISOString() : null,
          endDate: end ? end.toISOString() : null,
        };

        const added = await addEventToGoogleCalendar(googleAccessToken, calendarEvent, {
          requesterName: user.name || user.firstName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          requesterEmail: user.email,
        });

        calendarResult = { success: true, data: added };
      } catch (calErr) {
        console.error("[registerForEvent] Google Calendar insertion failed:", calErr);
        calendarResult = { success: false, error: calErr.message || String(calErr) };
      }
    }

    // 7) Return success with optional calendarResult
    res.status(201).json({
      message: "Successfully registered for event",
      registration: {
        ...registration._doc,
        user: user.toObject(),
        event: event.toObject(),
      },
      calendarResult,
    });
  } catch (err) {
    console.error("[registerForEvent] Server error:", err);
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "Duplicate registration" });
    }
    res.status(500).json({ error: "Server error" });
  }
};
