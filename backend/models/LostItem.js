// backend/models/LostItem.js
import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
  {
    // Which event this item belongs to (any event type)
    event: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "eventModel",
    },
    // Which model/collection this ObjectId refers to
    eventModel: {
      type: String,
      required: true,
      enum: ["Workshop", "Trip", "EO_Conference", "Bazaar", "GymSession", "Court"],
    },

    // Basic item info
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dateLost: Date,
    location: {
      type: String, // where it was lost 
    },
    // Status of the item
    status: {
      type: String,
      enum: ["unfound", "found"],
      default: "unfound",
    },

    // Who created the lost-item report
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByRole: {
      type: String,
      enum: [
        "student",
        "staff",
        "ta",
        "professor",
        "vendor",
        "EventsOffice",
        "admin",
        "Admin",
        "Unknown",
      ],
      required: true,
    },

    // How to contact about this item
    contactInfo: {
      type: String, // mobile phone or email
    },
    
    // Photo of the lost item
    photo: {
      type: String,
    },
  },
  { timestamps: true }
);

const LostItem = mongoose.model("LostItem", lostItemSchema);
export default LostItem;