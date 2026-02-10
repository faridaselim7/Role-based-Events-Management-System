import { User } from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, studentOrStaffId } = req.body;
    if (!firstName || !lastName || !email || !password || !studentOrStaffId) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      studentOrStaffId,
      role: "unKnown",      // match your schema's default
      isVerified: false,
      status: "Pending",    // match your schema's default
    });
    res.status(201).json({
      message: "Registration successful. Awaiting admin approval.",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentOrStaffId: user.studentOrStaffId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("registeredEvents");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.registeredEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // return profile including wallet balance
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      wallet: user.wallet || 0,
      status: user.status,
      isVerified: user.isVerified
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

