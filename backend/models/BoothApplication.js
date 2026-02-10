import mongoose from "mongoose";

const BoothApplicationSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  bazaarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bazaar",
    required: false, //null for non bazaar booths
  },
  attendees: [
    {
      name: String,
      email: String,
      // 🔹 NEW: store QR code content per external visitor (attendee)
      qrCode: String,
      idDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, // ← ADD THIS
    },
  ],
  setupDuration: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  boothSize: {
    type: String,
    required: true,
  },

    // 🔹 NEW: for recommendations
  categories: [
    {
      type: String,
      trim: true,
      // optional enum – adjust to your real categories or remove enum
      enum: [
        "Food",
        "Drinks",
        "Clothing",
        "Accessories",
        "Tech",
        "Games",
        "Services",
        "Other",
      ],
    },
  ],
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  
  // Payment fields
  amountDue: {
    type: Number,
    default: 0,
    min: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'wallet', 'none'],
    default: 'none'
  },
  stripePaymentIntentId: String,
  paymentDueDate: Date,
  paid: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  // 🔹 OPTIONAL: track when QR codes were sent in the receipt email
  qrCodesSentAt: Date,
}, { timestamps: true });

export default mongoose.model("BoothApplication", BoothApplicationSchema);
