import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import sgMail from "@sendgrid/mail";

// Try both named and default imports to avoid ESM export mismatch
import * as UserModule from "../models/User.js";
import * as AdminModule from "../models/adminModel.js";

// Resolve models (supports: export const User / export default User)
const User = UserModule.User || UserModule.default;
const Admin = AdminModule.Admin || AdminModule.default;

// Safe stubs if eventsController missing functions
let getAttendanceReport, getSalesReport;
try {
  const ec = await import("./eventsController.js");
  getAttendanceReport = ec.getAttendanceReport;
  getSalesReport = ec.getSalesReport;
} catch {
  getAttendanceReport = async (_req, res) =>
    res.json({ attendance: [], message: "Stub attendance report" });
  getSalesReport = async (_req, res) =>
    res.json({ sales: [], message: "Stub sales report" });
}

// ---------------- Helpers ----------------
const normalizeStatus = (s) => {
  if (!s) return "Active";
  const m = s.toLowerCase();
  if (m === "blocked") return "Blocked";
  if (m === "active") return "Active";
  if (m === "pending") return "Pending";
  return s;
};

// ---------------- Admin / Event Office ----------------
export const createAdminAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const allowed = ["Admin", "Event Office"];
    if (!allowed.includes(role))
      return res.status(400).json({ message: `role must be one of: ${allowed.join(", ")}` });

    const existing = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already exists." });

    //const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password, // make sure you hash the password
      role,
      status: "active"
    });

    res.status(201).json({ admin });
  } catch (e) {
    console.error("createAdminAccount error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getAllAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find({ role: { $in: ["Admin", "Event Office"] } }).select("-password");
    res.json({
      count: admins.length,
      admins: admins.map(a => ({
        id: a._id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        role: a.role,
        status: a.status
      }))
    });
  } catch (e) {
    console.error("getAllAdmins error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Account not found." });
    res.json({
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      status: admin.status
    });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const updateAdminAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, name, email, password, role, status } = req.body;
    const admin = await Admin.findById(id);
    if (!admin) return res.status(404).json({ message: "Account not found." });

    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      admin.firstName = parts.shift() || admin.firstName;
      admin.lastName = parts.join(" ") || admin.lastName;
    }
    if (firstName) admin.firstName = firstName.trim();
    if (lastName) admin.lastName = lastName.trim();
    if (email) admin.email = email.trim().toLowerCase();
    if (role) admin.role = role;
    if (status && ["Active", "Blocked"].includes(status)) admin.status = status;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();
    res.json({
      message: "Admin updated",
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        name: `${admin.firstName} ${admin.lastName}`.trim(),
        email: admin.email,
        role: admin.role,
        status: admin.status
      }
    });
  } catch (e) {
    console.error("updateAdminAccount error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const deleteAdminAccount = async (req, res) => {
  try {
    const doc = await Admin.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Account not found." });
    await doc.deleteOne();
    res.json({ message: "Admin deleted", id: req.params.id });
  } catch (e) {
    console.error("deleteAdminAccount error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

// ---------------- Role Assignment / Verification ----------------
export const assignUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ message: "userId and role required" });
    const allowedRoles = ["Student", "TA", "Staff", "Professor"];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "Invalid role." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role && user.role.toLowerCase() !== "unknown")
      return res.status(400).json({ message: "Role already assigned." });

    user.role = role;
    user.isVerified = false;
    user.status = "Pending";

    const needVerification = ["TA", "Staff", "Professor"].includes(role);
    if (needVerification) {
      const token = crypto.randomBytes(32).toString("hex");
      user.verificationToken = token;
      user.verificationTokenExpires = Date.now() + 3600000;
    } else {
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      user.isVerified = true;
      user.status = "Active";
    }

    await user.save();

    if (needVerification) {
      setImmediate(async () => {
        try {
          if (!process.env.SENDGRID_API_KEY || !process.env.OUTLOOK_USER) return;
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
          const verifyLink = `${backendBase}/api/auth/verify/${user.verificationToken}?redirect=1`;

          const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
          await sgMail.send({
            to: user.email,
            from: process.env.OUTLOOK_USER,
            subject: "Account Verification",
            html: `<p>Hello ${displayName},</p>
                   <p>Your role is <strong>${user.role}</strong>. Verify your account:</p>
                   <a href="${verifyLink}">${verifyLink}</a>`
          });
          console.log("Verification email queued:", user.email);
        } catch (mailErr) {
          console.error("Email send error:", mailErr);
        }
      });
    }

    res.json({
      message: needVerification ? "Role assigned, verification email queued." : "Role assigned.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (e) {
    console.error("assignUserRole error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const verifyUserAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const redirect = req.query.redirect === "1";
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    if (!user) {
      if (redirect)
        return res.redirect(`${process.env.FRONTEND_URL}/login?verified=0&reason=invalid_or_expired`);
      return res.status(400).json({ message: "Invalid or expired token." });
    }
    user.isVerified = true;
    user.status = "Active";
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    if (redirect) return res.redirect(`${process.env.FRONTEND_URL}/login?verified=1`);
    res.json({ message: "Account verified." });
  } catch (e) {
    res.status(500).json({ message: e.message || "Server error" });
  }
};

// ---------------- Users List ----------------
// ---------------- Users List ----------------
// GET /api/accounts/allusers
export const getAllUsersForEventOffice = async (req, res) => {
  try {
    const users = await User.find({})
      .select("firstName lastName email role status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      users: users.map(u => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role || null,         // null if not assigned yet
        status: u.status || "Active",
        createdAt: u.createdAt,
      }))
    });
  } catch (err) {
    console.error("getAllUsersForEventOffice error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- Block / Unblock ----------------
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id." });

    const updated = await User.findByIdAndUpdate(
      id,
      { status: "Blocked" },
      { new: true, runValidators: false }
    ).select("firstName lastName email role status");
    if (!updated) return res.status(404).json({ message: "User not found." });

    res.json({
      message: "User blocked",
      user: {
        id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (e) {
    console.error("blockUser error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id." });

    const updated = await User.findByIdAndUpdate(
      id,
      { status: "Active" },
      { new: true, runValidators: false }
    ).select("firstName lastName email role status");
    if (!updated) return res.status(404).json({ message: "User not found." });

    res.json({
      message: "User unblocked",
      user: {
        id: updated._id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (e) {
    console.error("unblockUser error:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

// ---------------- Reports ----------------
export const getEventsAttendanceReport = async (req, res) => {
  return getAttendanceReport(req, res);
};

export const getEventsSalesReport = async (req, res) => {
  return getSalesReport(req, res);
};