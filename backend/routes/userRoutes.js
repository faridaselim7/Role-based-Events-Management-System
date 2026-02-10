import express from "express";
import { getUserEvents, getUserProfile } from "../controllers/userController.js";
const router = express.Router();

router.get("/:id/events", getUserEvents);
router.get("/:id", getUserProfile);

export default router;