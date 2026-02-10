import mongoose from "mongoose";

const gymSessionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true, // e.g. "10:00 AM"
    },
    durationMins: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      required: true,
      enum: ["yoga", "pilates", "aerobics", "zumba", "cross_circuit", "kick_boxing"],
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      default: "published",
      enum: ["published", "cancelled", "completed"],
    },
    // Req #85 - Events Office cancels gym session
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // who is allowed to register
    allowedUserTypes: {
      type: [String],
      enum: ["Student", "Staff", "TA", "Professor"],
      default: ["Student", "Staff", "TA", "Professor"]    },

    // ✅ NEW: archiving
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    registrations: [
      {
        userId: String,
        name: String,
        role: { type: String },
        registeredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const GymSession = mongoose.model("GymSession", gymSessionSchema, "gymsessions");