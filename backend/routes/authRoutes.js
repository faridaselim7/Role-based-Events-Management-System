// backend/routes/authRoutes.js
import express from "express";
import { signup, login, verifyAccount, getCurrentUser } from "../controllers/authController.js";
import { protect } from "../middleware/protect.js";
// Add these imports at the top
import { forgotPassword, resetPasswordFromToken } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/verify/:token", verifyAccount);
router.get("/me", protect, getCurrentUser);

// Add these routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPasswordFromToken);

export default router;  // ESM default export
