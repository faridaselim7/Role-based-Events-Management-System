// frontend/src/pages/VisitorQuiz.jsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Store, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api"; // adjust path if your api file is elsewhere

const interestOptions = [
  { id: "food", label: "Food & Drinks", tags: ["food", "drinks"] },
  { id: "fashion", label: "Fashion & Accessories", tags: ["clothing", "accessories"] },
  { id: "tech", label: "Tech & Gadgets", tags: ["tech"] },
  { id: "games", label: "Games & Entertainment", tags: ["games"] },
  { id: "services", label: "Services & Wellness", tags: ["services"] },
];

const vibeOptions = [
  { id: "quick", label: "Quick snack / grab & go", tags: ["food"] },
  { id: "chill", label: "Chill, look around slowly", tags: ["fashion", "accessories", "services"] },
  { id: "experience", label: "Fun experiences / games", tags: ["games", "tech"] },
];

const budgetOptions = [
  { id: "low", label: "Under 150 EGP", tags: ["food", "services"] },
  { id: "medium", label: "150–400 EGP", tags: ["fashion", "accessories"] },
  { id: "high", label: "400+ EGP", tags: ["tech", "fashion", "accessories"] },
];

function VisitorQuiz() {
  const [searchParams] = useSearchParams();
  const bazaarId = searchParams.get("bazaarId") || null;

  const [interest, setInterest] = useState(null);
  const [vibe, setVibe] = useState(null);
  const [budget, setBudget] = useState(null);

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const buildPreferences = () => {
    const tags = new Set();

    const addTags = (optArray, id) => {
      const found = optArray.find((o) => o.id === id);
      if (found?.tags) {
        found.tags.forEach((t) => tags.add(t));
      }
    };

    if (interest) addTags(interestOptions, interest);
    if (vibe) addTags(vibeOptions, vibe);
    if (budget) addTags(budgetOptions, budget);

    return Array.from(tags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");
    setRecommendations([]);

    // minimal validation: at least interest
    if (!interest) {
      setError("Please select at least what you're most interested in today.");
      return;
    }

    const preferences = buildPreferences();
    if (preferences.length === 0) {
      setError("Could not build preferences from your answers. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const body = {
        preferences,
        limit: 5,
      };
      if (bazaarId) body.bazaarId = bazaarId;

      const res = await api.post("/booths/recommendations/from-quiz", body);
      setRecommendations(res.data?.recommendations || []);
    } catch (err) {
      console.error("Quiz recommendation error:", err);
      setError(
        err.response?.data?.message ||
          "Something went wrong while fetching recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5FAF7] to-[#E7F0EB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-[#D7E5E0] p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-[#2D5F4F] flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2D5F4F]">
              Find Your Perfect Booth
            </h1>
            <p className="text-sm md:text-base text-[#5F8273] mt-1">
              Answer a few quick questions and we&apos;ll recommend the booths that match you best.
            </p>
          </div>
        </div>

        {/* Quiz form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Q1 */}
          <div>
            <p className="font-semibold text-[#2D5F4F] mb-3">
              1. What are you most interested in today?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interestOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setInterest(opt.id)}
                  className={`text-left rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    interest === opt.id
                      ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-md"
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
            <p className="font-semibold text-[#2D5F4F] mb-3">
              2. What kind of vibe are you looking for?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vibeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVibe(opt.id)}
                  className={`text-left rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    vibe === opt.id
                      ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-md"
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
            <p className="font-semibold text-[#2D5F4F] mb-3">
              3. What&apos;s your budget level?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {budgetOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBudget(opt.id)}
                  className={`text-left rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                    budget === opt.id
                      ? "border-[#2D5F4F] bg-[#E4F2EC] text-[#23493C] shadow-md"
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
            <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs md:text-sm text-[#7A9A8C]">
              This helps us match you with booths you&apos;ll actually enjoy. It takes less than a minute.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2D5F4F] px-5 py-2.5 text-sm md:text-base font-semibold text-white shadow-md hover:bg-[#23493C] disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Results */}
        {submitted && !loading && (
          <div className="mt-8 border-t border-[#E1ECE6] pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-[#2D5F4F]" />
              <h2 className="text-lg md:text-xl font-bold text-[#2D5F4F]">
                Recommended booths for you
              </h2>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-sm text-[#6B8E7F]">
                No matching booths yet. Once vendors tag their booths with interests, this page will
                start recommending the best matches for each visitor.
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
                      className="rounded-2xl border border-[#D7E5E0] bg-[#FAFDFC] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#E4F2EC] px-3 py-1 text-xs font-semibold text-[#2D5F4F] mb-1">
                            <Store className="w-3 h-3" />
                            {vendor.companyName || "Vendor booth"}
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-[#23493C]">
                            {booth.location || "Location TBA"}
                          </h3>
                        </div>
                        <div className="text-right text-xs text-[#7A9A8C]">
                          <div className="font-semibold text-[#2D5F4F]">
                            Score: {item.score ?? 0}
                          </div>
                          {item.bazaarStatus && (
                            <div className="capitalize">{item.bazaarStatus}</div>
                          )}
                        </div>
                      </div>

                      {bazaar.name && (
                        <div className="flex items-center gap-1 text-xs text-[#6B8E7F] mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{bazaar.name}</span>
                        </div>
                      )}

                      {item.reason && (
                        <p className="text-xs text-[#4A7B6B] mt-1">{item.reason}</p>
                      )}

                      {(booth.categories?.length || booth.tags?.length) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(booth.categories || []).map((c) => (
                            <span
                              key={`cat-${booth._id}-${c}`}
                              className="rounded-full bg-[#E4F2EC] px-2.5 py-0.5 text-[11px] font-medium text-[#2D5F4F]"
                            >
                              {c}
                            </span>
                          ))}
                          {(booth.tags || []).map((t) => (
                            <span
                              key={`tag-${booth._id}-${t}`}
                              className="rounded-full bg-[#FDE6EE] px-2.5 py-0.5 text-[11px] font-medium text-[#B23158]"
                            >
                              {t}
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
    </div>
  );
}

export default VisitorQuiz;
