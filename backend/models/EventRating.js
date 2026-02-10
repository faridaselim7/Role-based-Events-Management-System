import mongoose from "mongoose";

const eventRatingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    userType: {
      type: String,
      required: true,
      enum: ["student", "staff", "ta", "professor"],
      lowercase: true,
      trim: true,
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ["event", "conference", "workshop", "bazaar", "trip"],
      lowercase: true,
      trim: true,
    },
    rating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, trim: true, maxlength: 1000, default: null },

    // ✅ Favorites (independent)
    favorite: { type: Boolean, default: false },

    // moderation (leave if already present)
    commentRemovedAt: { type: Date, default: null },
    commentRemovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    commentRemovalReason: { type: String, maxlength: 300, default: null },
  },
  { timestamps: true }
);

eventRatingSchema.index({ userId: 1, eventId: 1, eventType: 1 }, { unique: true });

export const EventRating = mongoose.model("EventRating", eventRatingSchema);
export default EventRating;