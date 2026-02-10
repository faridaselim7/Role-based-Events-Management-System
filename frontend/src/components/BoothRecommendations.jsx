// frontend/src/components/BoothRecommendations.jsx
import React, { useState } from "react";
import { Sparkles, Store, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

// Simple quiz options → mapped to tags we used in the form/model
const interestOptions = [
  { id: "food", label: "Food & Drinks", tags: ["Food", "Drinks"] },
  { id: "fashion", label: "Fashion & Accessories", tags: ["Clothing", "Accessories"] },
  { id: "tech", label: "Tech & Gadgets", tags: ["Tech"] },
  { id: "games", label: "Games & Fun", tags: ["Games"] },
  { id: "services", label: "Services & Wellness", tags: ["Services"] },
];

const vibeOptions = [
  { id: "quick", label: "Quick snack / grab & go", tags: ["Food"] },
  { id: "chill", label: "Chill browsing & vibes", tags: ["Clothing", "Accessories", "Services"] },
  { id: "experience", label: "Experiences / games / demos", tags: ["Games", "Tech"] },
];

const budgetOptions = [
  { id: "low", label: "Under 150 EGP", tags: ["Food", "Services"] },
  { id: "medium", label: "150–400 EGP", tags: ["Clothing", "Accessories"] },
  { id: "high", label: "400+ EGP", tags: ["Tech", "Accessories"] },
];

function BoothRecommendations({ userId }) {
  const [interest, setInterest] = useState(null);
  const [vibe, setVibe] = useState(null);
  const [budget, setBudget] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");

  // Turn the 3 answers into a list of preference tags
  const buildPreferences = () => {
    const tags = new Set();

    const addTags = (options, id) => {
      const opt = options.find((o) => o.id === id);
      if (opt?.tags) {
        opt.tags.forEach((t) => tags.add(t));
      }
    };

    if (interest) addTags(interestOptions, interest);
    if (vibe) addTags(vibeOptions, vibe);
    if (budget) addTags(budgetOptions, budget);

    return Array.from(tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    setRecommendations([]);

    // minimal validation → at least Q1
    if (!interest) {
      setError("Please answer at least the first question (what you're interested in).");
      return;
    }

    const preferences = buildPreferences();
    if (!preferences.length) {
      setError("Could not build preferences from your answers. Please try again.");
      return;
    }

    try {
      setLoading(true);

      const body = {
        preferences,  // e.g. ["Food","Games","Tech"]
        limit: 5,
      };
      if (userId) body.userId = userId;

      const res = await api.post("/booths/recommendations/from-quiz", body);
      setRecommendations(res.data?.recommendations || []);
    } catch (err) {
      console.error("Booth recommendations error:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong while fetching recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-[#2D5F4F] flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#2D5F4F]">
            AI Booth Recommendations
          </h2>
          <p className="text-sm text-[#6B8E7F]">
            Answer a few quick questions and we&apos;ll suggest the booths that match you best.
          </p>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="bg-white rounded-2xl border border-[#D7E5E0] shadow-sm p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Q1 */}
          <div>
            <p className="text-sm font-semibold text-[#2D5F4F] mb-2">
              1. What are you most interested in today? <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {interestOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInterest(opt.id)}
                  className={`text-left rounded-xl border px-3.5 py-2.5 text-sm font-medium transition
                    ${
                      interest === opt.id
                        ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-sm"
                        : "border-[#D7E5E0] bg-white text-[#48695C] hover:bg-[#F5FAF7]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div>
            <p className="text-sm font-semibold text-[#2D5F4F] mb-2">
              2. What kind of vibe are you looking for?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {vibeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVibe(opt.id)}
                  className={`text-left rounded-xl border px-3.5 py-2.5 text-sm font-medium transition
                    ${
                      vibe === opt.id
                        ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-sm"
                        : "border-[#D7E5E0] bg-white text-[#48695C] hover:bg-[#F5FAF7]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div>
            <p className="text-sm font-semibold text-[#2D5F4F] mb-2">
              3. What&apos;s your budget level?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBudget(opt.id)}
                  className={`text-left rounded-xl border px-3.5 py-2.5 text-sm font-medium transition
                    ${
                      budget === opt.id
                        ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-sm"
                        : "border-[#D7E5E0] bg-white text-[#48695C] hover:bg-[#F5FAF7]"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs md:text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
            <p className="text-[11px] md:text-xs text-[#7A9A8C]">
              We map your answers to booth categories & tags (food, fashion, tech, games…) and rank booths by how well they match.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D5F4F] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#23493C] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding booths...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Recommendations
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {submitted && !loading && (
        <div className="bg-white rounded-2xl border border-[#D7E5E0] shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-[#2D5F4F]" />
            <h3 className="text-lg font-bold text-[#2D5F4F]">
              Recommended booths for you
            </h3>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-sm text-[#6B8E7F]">
              No matching booths yet. Once vendors start tagging their booths with categories and tags,
              this section will show the top matches for each visitor.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((item) => {
                const booth = item.booth || {};
                const vendor = booth.vendorId || {};
                const bazaar = booth.bazaarId || {};

                return (
                  <div
                    key={booth._id}
                    className="rounded-2xl border border-[#D7E5E0] bg-[#FAFDFC] p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E4F2EC] px-3 py-1 text-[11px] font-semibold text-[#2D5F4F] mb-1">
                          <Store className="w-3 h-3" />
                          {vendor.companyName || "Vendor booth"}
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-[#23493C]">
                          {booth.location || "Location TBA"}
                        </h4>
                      </div>
                      <div className="text-right text-[11px] text-[#7A9A8C]">
                        <div className="font-semibold text-[#2D5F4F]">
                          Score: {item.score ?? 0}
                        </div>
                        {item.matches && (
                          <div>{item.matches} matches</div>
                        )}
                      </div>
                    </div>

                    {bazaar.name && (
                      <div className="flex items-center gap-1 text-[11px] text-[#6B8E7F]">
                        <MapPin className="w-3 h-3" />
                        <span>{bazaar.name}</span>
                      </div>
                    )}

                    {item.reason && (
                      <p className="text-xs text-[#4A7B6B] mt-1">{item.reason}</p>
                    )}

                    {(booth.categories?.length || booth.tags?.length) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(booth.categories || []).map((c) => (
                          <span
                            key={`cat-${booth._id}-${c}`}
                            className="rounded-full bg-[#E4F2EC] px-2.5 py-0.5 text-[10px] font-medium text-[#2D5F4F]"
                          >
                            {c}
                          </span>
                        ))}
                        {(booth.tags || []).map((t) => (
                          <span
                            key={`tag-${booth._id}-${t}`}
                            className="rounded-full bg-[#FDE6EE] px-2.5 py-0.5 text-[10px] font-medium text-[#B23158]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BoothRecommendations;
