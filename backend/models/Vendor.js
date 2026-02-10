import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const vendorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  
  // Req #3 - Vendor uploads tax card and logo
  documents: {
    taxCard: {
      fileName: String,
      filePath: String,
      uploadedAt: Date,
    },
    logo: {
      fileName: String,
      filePath: String,
      uploadedAt: Date,
    }
  },
  wallet: {
    type: Number,
    default: 0,
    min: 0
  },

}, { timestamps: true });

// Hash password before saving
vendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("Vendor", vendorSchema);
