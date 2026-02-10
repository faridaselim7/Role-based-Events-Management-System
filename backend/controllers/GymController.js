import { GymSession } from "../models/GymSession.js";
import { User } from '../models/User.js';
import { notifyGymSessionChangeEmail } from "../controllers/notifyController.js";

const USER_TYPES = ["Student", "Staff", "TA", "Professor"];

const normalizeRole = (rawRole) => {
  if (!rawRole) return null;
  const match = USER_TYPES.find(
    (t) => t.toLowerCase() === String(rawRole).toLowerCase()
  );
  return match || null;
};

// ← ADD THIS: Create new gym session
export const createGymSession = async (req, res) => {
  try {
    const { date, time, durationMins, type, maxParticipants, allowedUserTypes } = req.body;
    
    // Validation
    if (!date || !time || !durationMins || !type || !maxParticipants) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newSession = new GymSession({
      date,
      time,
      durationMins,
      type,
      maxParticipants,
      allowedUserTypes: allowedUserTypes && allowedUserTypes.length > 0 
        ? allowedUserTypes 
        : ['Student', 'Staff', 'TA', 'Professor'],
      status: 'published'
    });
    
    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating gym session:', error);
    res.status(500).json({ message: error.message || 'Failed to create gym session' });
  }
};


// Req #85 - Events Office cancels gym session
export const cancelGymSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;

    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Gym session not found' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ message: 'Session is already cancelled' });
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.cancellationReason = cancellationReason || 'No reason provided';
    session.cancelledBy = userId;

    await session.save();

    // 🔔 Notify all registered users by email
    try {
      const regs = Array.isArray(session.registrations)
        ? session.registrations
        : [];

      const userIds = [
        ...new Set(
          regs
            .map((r) => r.userId)
            .filter(Boolean)
        ),
      ];

      if (userIds.length > 0) {
        const users = await User.find({ _id: { $in: userIds } })
          .select("email firstName lastName");

        await notifyGymSessionChangeEmail({
          session,
          users,
          changeType: "cancelled",
        });
      } else {
        console.log("No registrations found on session, skipping cancel emails");
      }
    } catch (notifyErr) {
      console.error("Failed to send gym cancellation emails:", notifyErr);
    }

    res.status(200).json({
      message: 'Gym session cancelled successfully',
      session
    });

  } catch (error) {
    console.error('Error cancelling gym session:', error);
    res.status(500).json({ message: 'Failed to cancel gym session', error: error.message });
  }
};

// Req #86 - Events Office edits gym session (date/time/duration)
export const editGymSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date, time, durationMins, type, maxParticipants, allowedUserTypes } = req.body;

    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Gym session not found' });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit a cancelled session' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Cannot edit a completed session' });
    }

    // Update allowed fields
    if (date) session.date = new Date(date);
    if (time) session.time = time;
    if (durationMins) session.durationMins = durationMins;
    if (type) session.type = type;
    if (maxParticipants) session.maxParticipants = maxParticipants;

    // ✅ relevant: allow EO to update allowedUserTypes
    if (Array.isArray(allowedUserTypes)) {
      session.allowedUserTypes =
        allowedUserTypes.length > 0
          ? allowedUserTypes
          : ['Student', 'Staff', 'TA', 'Professor'];
    }

    await session.save();

    // 🔔 Notify all registered users by email about the update
    try {
      const regs = Array.isArray(session.registrations)
        ? session.registrations
        : [];

      const userIds = [
        ...new Set(
          regs
            .map((r) => r.userId)
            .filter(Boolean)
        ),
      ];

      if (userIds.length > 0) {
        const users = await User.find({ _id: { $in: userIds } })
          .select("email firstName lastName");

        await notifyGymSessionChangeEmail({
          session,
          users,
          changeType: "edited",
        });
      } else {
        console.log("No registrations found on session, skipping edit emails");
      }
    } catch (notifyErr) {
      console.error("Failed to send gym edit emails:", notifyErr);
    }

    res.status(200).json({
      message: 'Gym session updated successfully',
      session
    });

  } catch (error) {
    console.error('Error editing gym session:', error);
    res.status(500).json({ message: 'Failed to edit gym session', error: error.message });
  }
};

// Get single gym session
export const getGymSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Gym session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching gym session:', error);
    res.status(500).json({ message: 'Failed to fetch gym session', error: error.message });
  }
};

// Get all gym sessions
export const getAllGymSessions = async (req, res) => {
  try {
    const { type, status, userType } = req.query;
    const filters = {};

    if (type) filters.type = type;
    if (status) filters.status = status;

    // ✅ relevant: apply allowedUserTypes filter based on userType
    let audienceFilter = {};
    const normalized = normalizeRole(userType);
    if (normalized) {
      audienceFilter = {
        $or: [
          { allowedUserTypes: { $exists: false } },
          { allowedUserTypes: { $size: 0 } },
          { allowedUserTypes: normalized },
        ],
      };
    }

    const sessions = await GymSession.find({
      ...filters,
      ...audienceFilter,
    }).sort({ date: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching gym sessions:', error);
    res.status(500).json({ message: 'Failed to fetch gym sessions', error: error.message });
  }
};

// Register for a gym session
export const registerForSession = async (req, res) => {
  try {
    const { sessionId, userId, name, role } = req.body;
    if (!sessionId || !userId || !name || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Find session
    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // ✅ relevant: check allowedUserTypes restriction
    if (
      Array.isArray(session.allowedUserTypes) &&
      session.allowedUserTypes.length > 0
    ) {
      const allowedNormalized = session.allowedUserTypes.map((r) =>
        String(r).toLowerCase()
      );
      if (!allowedNormalized.includes(normalizedRole.toLowerCase())) {
        return res.status(403).json({
          message: "You are not allowed to register for this session",
        });
      }
    }

    // Check for duplicate registration
    const alreadyRegistered = session.registrations.some(
      (r) => r.userId === userId
    );
    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered for this session" });
    }

    // Check max participants
    if (session.registrations.length >= session.maxParticipants) {
      return res.status(400).json({ message: "Session is full" });
    }

    // Register (store normalized role)
    session.registrations.push({ userId, name, role: normalizedRole });
    await session.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
