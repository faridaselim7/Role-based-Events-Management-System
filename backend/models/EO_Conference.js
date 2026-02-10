import mongoose from "mongoose";

const eoConferenceSchema = new mongoose.Schema(
  {
    // Core
    title: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    fullAgenda: { type: String, default: "" },
    website: { type: String, default: "" },

    // Schedule
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Budget & resources
    requiredBudget: { type: Number, min: 0, required: true },
    fundingSource: { type: String, enum: ["external", "guc"], required: true },
    extraResources: { type: String, default: "" },

    // Workflow (EO creates ⇒ already approved & published)
    status: { type: String, enum: ["approved"], default: "approved" },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: () => new Date() },

    // Audit
    createdBy: { type: String, default: "Events Office User" },

    // who is allowed to register
    allowedUserTypes: {
      type: [String],
      enum: ["Student", "Staff", "TA", "Professor"],
      default: ["Student", "Staff", "TA", "Professor"],
    },

    // ✅ NEW: archiving
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const EO_Conference = mongoose.model("EO_Conference", eoConferenceSchema);
export default EO_Conference;
