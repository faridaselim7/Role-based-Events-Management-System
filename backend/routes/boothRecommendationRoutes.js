// backend/routes/boothRecommendationRoutes.js
import express from "express";
import { recommendBoothsFromQuiz } from "../controllers/boothRecommendationController.js";

const router = express.Router();

// We use POST because we're sending the quiz answers in the body
router.post("/recommendations/from-quiz", recommendBoothsFromQuiz);

export default router;
