// backend/services/boothRecommendationService.js
import BoothApplication from "../models/BoothApplication.js";

/**
 * Helper: determine bazaar status relative to now
 */
function getBazaarStatus(bazaar) {
  if (!bazaar?.startDateTime || !bazaar?.endDateTime) return "unknown";

  const now = Date.now();
  const start = new Date(bazaar.startDateTime).getTime();
  const end = new Date(bazaar.endDateTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "unknown";

  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}


/**
 * Core logic for quiz-based recommendations.
 * - preferences: array of strings from visitor quiz ["food", "fashion", "tech"]
 * - bazaarId: optional; if provided, only consider booths in that bazaar
 * - limit: max number of booths to return
 */
export async function getBoothRecommendationsFromPreferences({
  preferences = [],
  bazaarId,
  limit = 5,
}) {
  const normalizedPrefs = (preferences || [])
    .map((p) => p?.toString().trim().toLowerCase())
    .filter(Boolean);

  if (!normalizedPrefs.length) {
    throw new Error("No preferences provided for recommendation");
  }

  const query = { status: "Accepted" };
  if (bazaarId) query.bazaarId = bazaarId;

  // Load booths with vendor + bazaar populated
  const booths = await BoothApplication.find(query)
    .populate("vendorId")
    .populate("bazaarId")
    .lean();

  const scored = [];

  for (const booth of booths) {
    // Support both styles: [{type:String}] or [String]
    const rawCategories = booth.categories || [];
    const rawTags = booth.tags || [];

    const boothCategories = rawCategories.map((c) =>
      c?.toString().trim().toLowerCase()
    );
    const boothTags = rawTags.map((t) => t?.toString().trim().toLowerCase());

    const allLabels = [...new Set([...boothCategories, ...boothTags])];

    // Overlap between visitor preferences and booth labels
    const matchedPrefs = normalizedPrefs.filter((p) => allLabels.includes(p));

    if (!matchedPrefs.length) {
      // no overlap → don't recommend this booth
      continue;
    }

    let score = 0;

    // 🔹 Main weight: number of matched preferences
    score += matchedPrefs.length * 3;

    // 🔹 Timing bonus: prefer ongoing/soon bazaars
    const bazaarStatus = getBazaarStatus(booth.bazaarId);
    if (bazaarStatus === "ongoing") score += 3;
    else if (bazaarStatus === "upcoming") score += 2;

    // 🔹 Bonus for having multiple labels
    if (allLabels.length >= 3) score += 1;

    let reason = `Matches your interest in ${matchedPrefs.join(", ")}`;
    if (bazaarStatus === "ongoing") {
      reason += " and is happening right now";
    } else if (bazaarStatus === "upcoming") {
      reason += " and will happen soon";
    }

    scored.push({
      booth,
      score,
      matchedPreferences: matchedPrefs,
      bazaarStatus,
      reason,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
