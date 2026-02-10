import mongoose from "mongoose";
import Event from "../models/Event.js";
import { Workshop } from "../models/Workshop.js";
import Bazaar from "../models/Bazaar.js";
import Trip from "../models/Trip.js";
import EO_Conference from "../models/EO_Conference.js";
import EventRating from "../models/EventRating.js";
import User from "../models/User.js";
import Registration from "../models/Registration.js"; // ✅ Missing import added
import sgMail from "@sendgrid/mail";

// lazy init + unified env resolution
let sgReady = false;
function resolveSendGridKey() {
  return (
    process.env.SENDGRID_API_KEY ||
    process.env.SENDGRID_KEY ||
    process.env.SENDGRID_TOKEN ||
    process.env.ADMIN_SENDGRID_API_KEY ||
    process.env.ADMIN_SENDGRID_KEY
  );
}
function resolveSendGridFrom() {
  return (
    process.env.SENDGRID_FROM ||     // preferred
    process.env.MAIL_FROM ||         // if Admin uses MAIL_FROM
    process.env.SENDGRID_SENDER ||   // aliases
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.OUTLOOK_USER         // final fallback (your mailbox)
  );
}
function ensureSendGrid() {
  if (sgReady) return true;
  const key = resolveSendGridKey();
  if (!key) return false;
  try { sgMail.setApiKey(key); sgReady = true; return true; } catch { return false; }
}

const ALLOWED_USER_ROLES = new Set(["student", "staff", "ta", "professor"]);
const ALLOWED_EVENT_TYPES = new Set(["event", "conference", "workshop", "bazaar", "trip"]);

const EVENT_TYPE_VARIANTS = {
  event: ["event"],
  workshop: ["workshop"],
  bazaar: ["bazaar"],
  trip: ["trip"],
  conference: ["conference", "conference_eo"],
};

async function loadEventByType(eventType, eventId) {
  switch (eventType) {
    case "workshop":
      return Workshop.findById(eventId).lean();
    case "bazaar":
      return Bazaar.findById(eventId).lean();
    case "trip":
      return Trip.findById(eventId).lean();
    case "conference": {
      const direct = await Event.findOne({ _id: eventId, category: "conference" }).lean();
      if (direct) return direct;
      return EO_Conference.findById(eventId).lean();
    }
    case "event":
      return Event.findById(eventId).lean();
    default:
      return null;
  }
}

function firstValidDate(...values) {
  for (const val of values) {
    if (!val) continue;
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function deriveEventWindow(event, eventType) {
  if (!event) return { start: null, end: null };
  const start = firstValidDate(
    event.startDate,
    event.startDateTime,
    event.date,
    event.conference?.startDate
  );
  const end = firstValidDate(
    event.endDate,
    event.endDateTime,
    event.date,
    event.conference?.endDate,
    event.startDate,
    event.startDateTime
  );
  return { start, end: end ?? start };
}

// OPTIONAL: allow comment after event STARTS (remove “must be finished” rule)
// Set REQUIRE_FINISH_FOR_COMMENT = true to keep old behavior
const REQUIRE_FINISH_FOR_COMMENT = false;

async function prepareEventContext(req, res) {
  try {
    const { eventType = "", eventId = "" } = req.params;
    const normalizedEventType = String(eventType).toLowerCase().trim();

    if (!ALLOWED_EVENT_TYPES.has(normalizedEventType)) {
      res.status(400).json({ message: "Unsupported event type." });
      return null;
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ message: "Invalid event id." });
      return null;
    }

    const userId = req.user?.id || req.body?.userId;
    const userRoleRaw = req.user?.role || req.body?.userType;
    const userRole = String(userRoleRaw || "").toLowerCase().trim();

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Missing or invalid userId." });
      return null;
    }
    if (!ALLOWED_USER_ROLES.has(userRole)) {
      res.status(403).json({ message: "Role not allowed for feedback." });
      return null;
    }

    const event = await loadEventByType(normalizedEventType, eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return null;
    }

    const registrationTypes = EVENT_TYPE_VARIANTS[normalizedEventType] || [normalizedEventType];
    const registration = await Registration.findOne({
      userId,
      userType: { $regex: new RegExp(`${userRole}$`, "i") },
      eventId,
      eventType: { $in: registrationTypes },
      status: { $nin: ["cancelled", "rejected"] },
    }).lean();

    if (!registration) {
      res.status(403).json({ message: "You can only submit feedback for events you registered for." });
      return null;
    }

    const { start, end } = deriveEventWindow(event, normalizedEventType);
    if (!start) {
      res.status(400).json({ message: "Event timing missing." });
      return null;
    }

    const now = new Date();
    if (REQUIRE_FINISH_FOR_COMMENT) {
      if (now < (end || start)) {
        res.status(400).json({ message: "You can submit feedback after the event has finished." });
        return null;
      }
    } else {
      if (now < start) {
        res.status(400).json({ message: "You can submit feedback after the event starts." });
        return null;
      }
    }

    return { normalizedEventType, eventId, userId, userRole };
  } catch (e) {
    console.error("prepareEventContext error:", e);
    res.status(500).json({ message: "Server error preparing context" });
    return null;
  }
}

export async function rateEvent(req, res) {
  try {
    const ctx = await prepareEventContext(req, res);
    if (!ctx) return;

    const numericRating = Number(req.body.rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const update = {
      userId: ctx.userId,
      userType: ctx.userRole,
      eventId: ctx.eventId,
      eventType: ctx.normalizedEventType,
      rating: numericRating,
    };

    const result = await EventRating.findOneAndUpdate(
      { userId: ctx.userId, eventId: ctx.eventId, eventType: ctx.normalizedEventType },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, rawResult: true }
    );

    const wasUpdate = result.lastErrorObject?.updatedExisting;
    res.status(200).json({
      message: wasUpdate ? "Rating updated." : "Rating submitted.",
      rating: result.value,
    });
  } catch (err) {
    console.error("rateEvent error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function commentOnEvent(req, res) {
  try {
    const ctx = await prepareEventContext(req, res);
    if (!ctx) return;

    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!comment) {
      return res.status(400).json({ message: "Comment text is required." });
    }
    if (comment.length > 1000) {
      return res.status(400).json({ message: "Comment must be 1000 characters or fewer." });
    }

    const result = await EventRating.findOneAndUpdate(
      { userId: ctx.userId, eventId: ctx.eventId, eventType: ctx.normalizedEventType },
      {
        $set: {
          userId: ctx.userId,
          userType: ctx.userRole,
          eventId: ctx.eventId,
          eventType: ctx.normalizedEventType,
          comment,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true, rawResult: true }
    );

    const wasUpdate = result.lastErrorObject?.updatedExisting;
    res.status(200).json({
      message: wasUpdate ? "Comment updated." : "Comment submitted.",
      feedback: result.value,
    });
  } catch (err) {
    console.error("commentOnEvent error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

export async function getEventRatings(req, res) {
  try {
    const { eventType = "", eventId = "" } = req.params;
    const normalizedEventType = String(eventType).toLowerCase().trim();

    if (!ALLOWED_EVENT_TYPES.has(normalizedEventType)) {
      return res.status(400).json({ message: "Unsupported event type." });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id." });
    }

    const event = await loadEventByType(normalizedEventType, eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    const ratings = await EventRating.find({
      eventType: normalizedEventType,
      eventId: eventObjectId,
    })
      .populate("userId", "firstName lastName email role")
      .sort({ updatedAt: -1 })
      .lean();

    const summary = await EventRating.aggregate([
      {
        $match: {
          eventType: normalizedEventType,
          eventId: eventObjectId,
          rating: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = summary.length ? Number(summary[0].average.toFixed(2)) : null;

    return res.status(200).json({
      message: ratings.length
        ? "Event feedback retrieved successfully."
        : "This event has no feedback yet.",
      count: ratings.length,
      averageRating,
      feedback: ratings,
    });
  } catch (err) {
    console.error("getEventRatings error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

// SendGrid email sender (same key/from used by Admin)
async function sendCommentDeletionEmail({ to, userName, eventTitle, eventType, reason, removedAt }) {
  try {
    if (!to) return { sent: false, skipped: "missing_recipient" };
    if (!ensureSendGrid()) return { sent: false, skipped: "missing_api_key" };

    const from = resolveSendGridFrom();
    if (!from) return { sent: false, skipped: "missing_from" };

    const subject = "Warning: Your comment was removed for inappropriate content";
    const lines = [
      `Hello${userName ? " " + userName : ""},`,
      "",
      "Your comment on the event was removed by an administrator for inappropriate content.",
      `- Event: ${eventTitle || "(untitled)"} [${eventType}]`,
      `- Time: ${new Date(removedAt || Date.now()).toLocaleString()}`,
      reason ? `- Reason: ${reason}` : null,
      "",
      "Please adhere to the community guidelines when posting comments.",
      "Thank you.",
    ].filter(Boolean);

    const [resp] = await sgMail.send({
      to,
      from,
      subject,
      text: lines.join("\n"),
      html: lines.map(l => (l ? `<p>${l}</p>` : "<br/>")).join(""),
    });

    const messageId = resp?.headers?.["x-message-id"] || resp?.headers?.["x-message-id".toLowerCase()];
    return { sent: true, messageId };
  } catch (err) {
    return { sent: false, error: err?.message || "send_failed" };
  }
}

export async function deleteComment(req, res) {
  try {
    const { eventType = "", eventId = "" } = req.params;
    const normalizedEventType = String(eventType).toLowerCase().trim();

    // accept either /:userId/comment (preferred) or legacy /:feedbackId/comment
    const targetId = req.params.userId || req.params.feedbackId;
    const usingUserId = Boolean(req.params.userId);

    if (!ALLOWED_EVENT_TYPES.has(normalizedEventType)) {
      return res.status(400).json({ message: "Unsupported event type." });
    }
    if (![eventId, targetId].every(mongoose.Types.ObjectId.isValid)) {
      return res.status(400).json({ message: "Invalid id(s)." });
    }

    // Ensure the parent event exists
    const event = await loadEventByType(normalizedEventType, eventId);
    if (!event) return res.status(404).json({ message: "Event not found." });

    // Locate the feedback entry
    const query = usingUserId
      ? { userId: targetId, eventId, eventType: normalizedEventType }
      : { _id: targetId, eventId, eventType: normalizedEventType };

    const doc = await EventRating.findOne(query);
    if (!doc) {
      return res.status(404).json({
        message: usingUserId
          ? "Comment/rating entry not found for user."
          : "Comment/rating entry not found.",
      });
    }
    if (!doc.comment) return res.status(400).json({ message: "No comment to delete." });

    // capture for email before mutating
    const removalReason =
      typeof req.body?.reason === "string" && req.body.reason.trim()
        ? req.body.reason.trim().slice(0, 300)
        : null;
    const removedAt = new Date();

    // delete comment + moderation metadata
    doc.comment = null;
    doc.commentRemovedAt = removedAt;
    if (req.user?.id) doc.commentRemovedBy = req.user.id;
    if (removalReason) doc.commentRemovalReason = removalReason;
    await doc.save();

    // send warning email via SendGrid
    let emailStatus = { sent: false, skipped: "no_owner_email" };
    try {
      const owner = await User.findById(doc.userId).select("firstName lastName email").lean();
      if (owner?.email) {
        const eventTitle =
          event?.title || event?.name || (event?.conference?.title ? event.conference.title : null) || null;
        const userName = [owner?.firstName, owner?.lastName].filter(Boolean).join(" ").trim();
        emailStatus = await sendCommentDeletionEmail({
          to: owner.email,
          userName: userName || null,
          eventTitle,
          eventType: normalizedEventType,
          reason: removalReason,
          removedAt,
        });
      }
    } catch (e) {
      emailStatus = { sent: false, error: e?.message || "lookup_error" };
    }

    return res.json({
      message: "Comment removed by admin.",
      userId: String(doc.userId),
      feedbackId: String(doc._id),
      ratingStillPresent: doc.rating !== null,
      removal: {
        at: doc.commentRemovedAt,
        by: doc.commentRemovedBy,
        reason: doc.commentRemovalReason,
      },
      email: emailStatus
    });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

// ===== FAVORITES (independent) =====
const FAVORITE_ALLOWED_TYPES = new Set(["event", "conference", "workshop", "bazaar", "trip"]);

function normalizeType(t) {
  return String(t || "").trim().toLowerCase();
}

async function loadBasicEvent(eventType, eventId) {
  switch (eventType) {
    case "workshop": return Workshop.findById(eventId).select("title").lean();
    case "bazaar": return Bazaar.findById(eventId).select("name startDateTime").lean();
    case "trip": return Trip.findById(eventId).select("name startDateTime").lean();
    case "conference":
      // conference may be in Event (category=conference) or EO_Conference
      const ev = await Event.findOne({ _id: eventId, category: "conference" }).select("title conference.date date").lean();
      if (ev) return ev;
      return EO_Conference.findById(eventId).select("title startDate").lean();
    case "event": return Event.findById(eventId).select("title date").lean();
    default: return null;
  }
}

export async function addFavorite(req, res) {
  try {
    const eventType = normalizeType(req.params.eventType);
    const eventId = req.params.eventId;
    if (!FAVORITE_ALLOWED_TYPES.has(eventType)) return res.status(400).json({ message: "Unsupported event type." });
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(400).json({ message: "Invalid event id." });

    const userId = req.user?.id;
    const userRole = String(req.user?.role || "").toLowerCase();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Missing userId." });
    if (!ALLOWED_USER_ROLES.has(userRole)) return res.status(403).json({ message: "Role not allowed for favorites." });

    const exists = await loadBasicEvent(eventType, eventId);
    if (!exists) return res.status(404).json({ message: "Event not found." });

    const doc = await EventRating.findOneAndUpdate(
      { userId, eventId, eventType },
      {
        $set: {
          userId,
          userType: userRole,
          eventId,
          eventType,
          favorite: true,
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    res.json({ message: "Favorited.", favorite: true, recordId: doc._id });
  } catch (e) {
    console.error("addFavorite error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}

export async function removeFavorite(req, res) {
  try {
    const eventType = normalizeType(req.params.eventType);
    const eventId = req.params.eventId;
    if (!FAVORITE_ALLOWED_TYPES.has(eventType)) return res.status(400).json({ message: "Unsupported event type." });
    if (!mongoose.Types.ObjectId.isValid(eventId)) return res.status(400).json({ message: "Invalid event id." });

    const userId = req.user?.id;
    const userRole = String(req.user?.role || "").toLowerCase();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Missing userId." });
    if (!ALLOWED_USER_ROLES.has(userRole)) return res.status(403).json({ message: "Role not allowed for favorites." });

    const updated = await EventRating.findOneAndUpdate(
      { userId, eventId, eventType },
      { $set: { favorite: false } },
      { new: true }
    ).lean();

    res.json({ message: "Unfavorited.", favorite: false, existed: !!updated });
  } catch (e) {
    console.error("removeFavorite error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}

export async function listFavorites(req, res) {
  try {
    const userId = req.user?.id;
    const userRole = String(req.user?.role || "").toLowerCase();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Missing userId." });
    if (!ALLOWED_USER_ROLES.has(userRole)) return res.status(403).json({ message: "Role not allowed." });

    const rows = await EventRating.find({ userId, favorite: true }).lean();

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const ev = await loadBasicEvent(r.eventType, r.eventId);
        let title =
          ev?.title ||
          ev?.name ||
          (ev?.conference?.title ? ev.conference.title : null) ||
          null;
        return {
          eventId: r.eventId,
          eventType: r.eventType,
          title,
          favoritedAt: r.updatedAt || r.createdAt,
        };
      })
    );

    res.json({ message: "Favorites loaded.", count: enriched.length, favorites: enriched });
  } catch (e) {
    console.error("listFavorites error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}

// === REVIEWS (ADMIN / EVENT OFFICE) ===
export async function getEventReviews(req, res) {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "Invalid eventId" });

    const rows = await EventRating.find({ eventId })
      .populate("userId", "_id firstName lastName email role")  // ✅ Added _id
      .lean();

    const reviews = rows
      .filter(r => r.comment || r.rating !== null)
      .map(r => ({
        id: r._id,
        eventType: r.eventType,  // ✅ Added eventType from doc
        rating: r.rating ?? null,
        comment: r.comment ?? null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        userName: [r.userId?.firstName, r.userId?.lastName].filter(Boolean).join(" ").trim()
          || r.userId?.email
          || "Anonymous",
        user: r.userId  // ✅ Full populated user object (now includes _id)
          ? { 
              _id: r.userId._id,  // ✅ Explicit _id
              email: r.userId.email, 
              role: r.userId.role 
            }
          : null
      }));

    return res.json({ reviews });
  } catch (e) {
    console.error("getEventReviews error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}
export async function deleteEventReview(req, res) {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId))
      return res.status(400).json({ message: "Invalid reviewId" });

    const doc = await EventRating.findById(reviewId);
    if (!doc) return res.status(404).json({ message: "Review not found" });

    await doc.deleteOne();
    return res.json({ message: "Review deleted", id: reviewId });
  } catch (e) {
    console.error("deleteEventReview error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
}