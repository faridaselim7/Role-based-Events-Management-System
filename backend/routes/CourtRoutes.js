import express from "express";
import {
  getAllCourts,
  reserveCourt,
} from "../controllers/courtController.js";

const router = express.Router();

// GET all courts and availability
router.get("/", getAllCourts);

// POST: Reserve a court
router.post("/reserve", reserveCourt);

export default router;
