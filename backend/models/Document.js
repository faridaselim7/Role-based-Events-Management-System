import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  // Req #76 - Events Office/Admin views/downloads uploaded documents
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  documentType: {
    type: String,
    enum: ["tax_card", "logo", "vendor_id", "attendee_id", "permit", "certificate", "other"],
    required: true,
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attendeeId: String, // For attendee IDs
  bazaarApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: "BazaarApplication" },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
  
  fileSize: Number, // in bytes
  mimeType: String,
  
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: Date,
  rejectionReason: String,
  
}, { timestamps: true });

export default mongoose.model("Document", documentSchema);