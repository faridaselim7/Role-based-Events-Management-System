import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // hide password
    },
    role: {
      type: String,
      enum: ["Admin", "Event Office"],
      required: [true, "Role is required"],
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active", // default status
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hide password in JSON
// Virtual full name for backward compatibility (ret.name)
adminSchema.virtual("name").get(function () {
  const parts = [this.firstName, this.lastName].filter(Boolean);
  return parts.join(" ").trim();
});

adminSchema.set("toJSON", {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    return ret;
  },
});

const Admin = mongoose.model("Admin", adminSchema);

// ✅ Make sure you export exactly this
export { Admin };
