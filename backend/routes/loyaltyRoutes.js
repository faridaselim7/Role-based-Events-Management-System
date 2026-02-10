import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /api/loyalty/new-partners
router.get("/new-partners", async (req, res) => {
  try {
    const partners = await User.find({
      role: "Vendor",
      "loyaltyProgram.isEnrolled": true
    })
    .select("name email loyaltyProgram.enrolledAt")
    .sort({ "loyaltyProgram.enrolledAt": -1 });

    res.json(
      partners.map((p) => ({
        id: p._id,
        name: p.name || p.email,
        addedAt: p.loyaltyProgram.enrolledAt
      }))
    );
  } catch (err) {
    console.error("Error fetching new partners:", err);
    res.status(500).json({ error: "Failed to load new partners" });
  }
});

export default router;
