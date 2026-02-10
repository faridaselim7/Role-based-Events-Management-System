// backend/controllers/boothRecommendationController.js

import { getBoothRecommendationsFromPreferences } from "../services/boothRecommendationService.js";

/**
 * @route   POST /api/booths/recommendations/from-quiz
 * @desc    Get booth recommendations based on visitor quiz preferences
 * @body    {
 *            preferences: ["food", "fashion", "tech"],   // required, non-empty array
 *            bazaarId?: "....",                          // optional – filter by specific bazaar
 *            limit?: 3                                   // optional – max number of booths
 *          }
 * @returns {
 *            count: number,
 *            recommendations: [
 *              {
 *                booth: { ...full BoothApplication with vendorId & bazaarId populated },
 *                score: number,
 *                matchedPreferences: [ ... ],
 *                bazaarStatus: "upcoming" | "ongoing" | "past" | "unknown",
 *                reason: string
 *              },
 *              ...
 *            ]
 *          }
 */
export async function recommendBoothsFromQuiz(req, res) {
  try {
    const { preferences, bazaarId, limit } = req.body;

    // Validate input
    if (!Array.isArray(preferences) || preferences.length === 0) {
      return res.status(400).json({
        message: "preferences (non-empty array) is required in request body",
      });
    }

    const recommendations = await getBoothRecommendationsFromPreferences({
      preferences,
      bazaarId,
      limit: limit || 5,
    });

    return res.status(200).json({
      count: recommendations.length,
      recommendations,
    });
  } catch (err) {
    console.error("Error in recommendBoothsFromQuiz:", err);
    return res.status(500).json({
      message: "Failed to get booth recommendations",
      error: err.message,
    });
  }
}
