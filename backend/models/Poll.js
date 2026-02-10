import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
  // Req #82 - Events Office creates poll for vendor booth setup
  title: { type: String, required: true },
  description: { type: String },
  eventName: { type: String }, // Event name for vendor polls
  pollType: {
    type: String,
    enum: ["vendor_booth_setup", "event_planning", "general", "vendor_voting"],
    required: true,
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }, // Link to event
  bazaarId: { type: mongoose.Schema.Types.ObjectId, ref: "Bazaar" },
  
  // For vendor voting polls
  vendors: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      category: String,
      votes: { type: Number, default: 0 },
      votedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  
  // For general polls with options
  options: [
    {
      optionId: String,
      optionText: String,
      votes: { type: Number, default: 0 },
    },
  ],
  
  // Req #83 - Student/Staff/TA/Professor votes for vendor in poll
  votes: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      selectedOption: String,
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For vendor voting
      votedAt: { type: Date, default: Date.now },
    },
  ],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["active", "closed", "draft"],
    default: "active",
  },
  active: { type: Boolean, default: true }, // For frontend compatibility
  allowMultipleVotes: { type: Boolean, default: false },
  
}, { timestamps: true });

export default mongoose.model("Poll", pollSchema);