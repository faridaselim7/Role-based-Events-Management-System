import mongoose from "mongoose";

const bazaarApplicationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bazaarId: { type: mongoose.Schema.Types.ObjectId, ref: "Bazaar", required: true },
  attendees: [
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        idDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, // ← LINK TO FILE
        qrCode: String,
      },
      { id: false }  // THIS FIXES THE ERROR
    ),
  ],
   // 🔹 Add categories
  categories: [
    {
      type: String,
      trim: true,
      enum: [
        "Food",
        "Drinks",
        "Clothing",
        "Accessories",
        "Tech",
        "Games",
        "Services",
        "Other",
      ]
    }
  ],

  // 🔹 Add tags
  tags: [
    {
      type: String,
      trim: true
    }
  ],

  boothSize: {
    type: String,
    enum: ["2x2", "4x4"], 
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"], 
    default: "Pending",
  },

  // Req #66 - Track when QR codes were sent
  qrCodesSentAt: Date,
  amountDue: { type: Number, default: 0, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  paymentMethod: { type: String, enum: ['stripe','wallet','none'], default: 'none' },
  stripePaymentIntentId: String,
  paymentDueDate: Date,
  paid: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("BazaarApplication", bazaarApplicationSchema);
