// backend/models/VendorRequest.js
import mongoose from 'mongoose';
import { Notification } from "./Notification.js";

const vendorRequestSchema = new mongoose.Schema({
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, // bazaar or booth event
  vendorName:  { type: String, required: true },
  companyName: { type: String },
  contactEmail:{ type: String },
  phone:       { type: String },
  products:    [String],           // e.g. categories they’ll sell
  boothSize:   { type: String },   // e.g. "3x3", "5x5"
  notes:       { type: String },
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' }
}, { timestamps: true });

vendorRequestSchema.index({ event: 1 });
vendorRequestSchema.index({ status: 1 });

// Mark whether this document was new before save
vendorRequestSchema.pre("save", function (next) {
  this._wasNew = this.isNew;
  next();
});

// After save, if it's a NEW pending request, create a notification
vendorRequestSchema.post("save", async function (doc) {
  try {
    // Only fire on creation, not updates
    if (!doc._wasNew) return;
    if (doc.status !== "pending") return;

    // Load event title/category for a nicer message
    await doc.populate("event", "title category");

    const title = doc.event?.title || "an event";

    await Notification.create({
      type: "vendor_request_pending",
      message: `New vendor request pending for event: ${title}`,
      createdBy: null,                 // system-generated
      audienceRole: "events_office",   // EO + Admin will see it via EO route
    });
  } catch (err) {
    console.error(
      "Failed to create vendor_request_pending notification:",
      err
    );
  }
});


const VendorRequest = mongoose.model('VendorRequest', vendorRequestSchema);
export default VendorRequest;