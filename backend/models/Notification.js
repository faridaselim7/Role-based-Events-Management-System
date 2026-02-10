import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "workshop_submitted",
        "workshop_updated",
        "workshop_accepted",
        "workshop_rejected",
        "event_created",
        "event_reminder_1d",
        "event_reminder_1h",
        "vendor_request_pending",
        "loyalty_partner_added",
        "generic",
      ],
      required: true,
    },

    message: { type: String, required: true },

    // 🔹 existing workshop-related link
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop" },

    // 🔹 NEW: link reminder to a specific event
    eventId: { type: mongoose.Schema.Types.ObjectId },
    eventType: { type: String }, // 'workshop' | 'trip' | 'bazaar' | 'conference' | 'gym'

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🔹 who this notification is specifically for (for reminders)
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // 🔹 which role(s) should see it in global feeds
    audienceRole: {
      type: String,
      enum: ["events_office", "admin", "professor", "all"],
      default: "events_office",
    },

    // 🔹 who has marked it as read
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
