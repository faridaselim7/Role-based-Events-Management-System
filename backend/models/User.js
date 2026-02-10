import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    studentOrStaffId: { type: String }, // for internal users
    companyName: { type: String }, // for vendors
    role: {
      type: String,
      enum: ["Student", "Staff", "TA", "Professor", "Vendor", "EventsOffice", "Admin","Unknown"],
      default: "Student",
    },
    
     interests: [
      {
        type: String,
        trim: true, // e.g. "Food", "Tech", "Accessories"
      },
    ],
    
    // ADD THIS ENTIRE BLOCK
    loyaltyProgram: {
      isEnrolled: { type: Boolean, default: false },
      enrolledAt: Date,
      cancelledAt: Date,
      cancellationReason: String,
      tier: { type: String, default: 'bronze' },
      points: { type: Number, default: 0 },
      discountRate: Number,
      promoCode: String,
      termsAccepted: Boolean,
      termsAcceptedAt: Date
    },
     isVerified: {
      type: Boolean,
      default: false,   // <--- IMPORTANT
    },

    verificationToken: String,
    verificationTokenExpires: Date,

    // ADD THESE:
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    status: {
      type: String,
      enum: ["Pending", "Active", "Blocked"],
      default: "Pending",  // <--- IMPORTANT
    },
    wallet: {
      type: Number,
      default: 10000,
      min: 0
    },
    // Add to schema
  googleCalendar: {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    scope: { type: [String], default: [] },
    tokenType: { type: String, default: null },
    expiryDate: { type: Number, default: null },
    connected: { type: Boolean, default: false }
  }
  },
  { timestamps: true }
);

// ✅ Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Compare entered password with hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
export default mongoose.model('User', userSchema);