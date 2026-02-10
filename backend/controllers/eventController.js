// backend/controllers/eventController.js
import Registration from "../models/Registration.js";
import ExcelJS from "exceljs";

import Bazaar from "../models/Bazaar.js";
import Trip from "../models/Trip.js";
import { Workshop } from "../models/Workshop.js";
import Event from "../models/Event.js";        // conferences (EO_Conference)
import { GymSession } from "../models/GymSession.js";

const USER_TYPES = ["Student", "Staff", "TA", "Professor"];
const EVENT_TYPES = ["workshop", "trip", "bazaar", "conference", "gym"];

// =======================
// Register for event
// =======================
export const registerEvent = async (req, res) => {
  try {
    const { eventId, eventType, userId, userType, name, email } = req.body;

    // Basic validation
    if (!eventId || !eventType || !userId || !userType || !name || !email) {
      return res.status(400).json({
        message:
          "Missing required fields: eventId, eventType, userId, userType, name, email",
      });
    }

    // Normalize eventType
    const normalizedEventType = String(eventType).toLowerCase();
    if (!EVENT_TYPES.includes(normalizedEventType)) {
      return res.status(400).json({
        message:
          "eventType must be one of: workshop, trip, bazaar, conference, gym",
      });
    }

    // Normalize userType → one of the enum values
    const normalizedUserType =
      USER_TYPES.find(
        (t) => t.toLowerCase() === String(userType).toLowerCase()
      ) || null;

    if (!normalizedUserType) {
      return res.status(400).json({
        message: "userType must be one of: Student, Staff, TA, Professor",
      });
    }

    // Find the event document based on type
    let eventDoc = null;
    switch (normalizedEventType) {
      case "trip":
        eventDoc = await Trip.findById(eventId).lean();
        break;
      case "workshop":
        eventDoc = await Workshop.findById(eventId).lean();
        break;
      case "bazaar":
        eventDoc = await Bazaar.findById(eventId).lean();
        break;
      case "conference":
        eventDoc = await Event.findById(eventId).lean();
        break;
      case "gym":
        eventDoc = await GymSession.findById(eventId).lean();
        break;
      default:
        eventDoc = null;
    }

    if (!eventDoc) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 🔐 Restriction check using allowedUserTypes on the event
    //     ✔️ Now compares in a case-insensitive way
    let allowedUserTypes =
      Array.isArray(eventDoc.allowedUserTypes) &&
      eventDoc.allowedUserTypes.length
        ? eventDoc.allowedUserTypes
        : USER_TYPES; // if not set, everyone allowed

    // normalize both sides to avoid case / formatting issues
    const normalizedAllowed = allowedUserTypes
      .map((t) => String(t).toLowerCase());

    if (!normalizedAllowed.includes(normalizedUserType.toLowerCase())) {
      return res.status(403).json({
        message: `This event is restricted. Allowed user types: ${allowedUserTypes.join(
          ", "
        )}`,
      });
    }

    // Check for existing registration (eventId + userId + userType)
    const exists = await Registration.findOne({
      eventId,
      userId,
      userType: normalizedUserType,
    });

    if (exists) {
      return res.status(400).json({ message: "Already registered" });
    }

    // Create registration according to Registration schema
    await Registration.create({
      eventId,
      eventType: normalizedEventType,
      name,
      email,
      userId,
      userType: normalizedUserType,
      status: "registered",
    });

    res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    if (error?.code === 11000) {
      // unique index (eventId + userId + userType)
      return res.status(400).json({ message: "Already registered" });
    }
    console.error("Error in registerEvent:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================
// View my registrations
// =======================
export const getMyRegistrations = async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const filter = { userId };

    if (userType) {
      const normalizedUserType =
        USER_TYPES.find(
          (t) => t.toLowerCase() === String(userType).toLowerCase()
        ) || null;
      if (normalizedUserType) {
        filter.userType = normalizedUserType;
      }
    }

    const registrations = await Registration.find(filter)
      .sort({ registrationDate: -1 })
      .lean();

    res.json(registrations);
  } catch (error) {
    console.error("Error in getMyRegistrations:", error);
    res.status(500).json({ error: error.message });
  }
};

// =======================
// Export names in .xlsx (except conferences)
// =======================
export const exportEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await Registration.find({ eventId }).lean();

    if (!registrations.length) {
      return res
        .status(404)
        .json({ message: "No registrations found for this event." });
    }

    const firstType = registrations[0].eventType
      ? registrations[0].eventType.toLowerCase()
      : "";

    if (firstType === "conference") {
      return res
        .status(400)
        .json({ message: "Export not allowed for conferences." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Registrations");

    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "User Type", key: "userType", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Registration Date", key: "registrationDate", width: 24 },
      { header: "Event Type", key: "eventType", width: 15 },
    ];

    registrations.forEach((reg) => {
      worksheet.addRow({
        name: reg.name,
        email: reg.email,
        userType: reg.userType,
        status: reg.status || "registered",
        registrationDate: reg.registrationDate
          ? new Date(reg.registrationDate).toISOString().slice(0, 19).replace("T", " ")
          : "",
        eventType: reg.eventType,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=event_${eventId}_registrations.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting registrations:", error);
    res
      .status(500)
      .json({ message: "Server error while exporting registrations." });
  }
};
