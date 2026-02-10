import React, { useState, useEffect } from "react";
import { Store, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
  getCitronGlowEffect,
  getTyrianGlowEffect,
} from "../styles/EOdesignSystem";

const CardSkeleton = ({ count = 3 }) => (
  <div className="space-y-6">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl shadow-xl border overflow-hidden animate-pulse">
        <div className="bg-gray-300 h-32" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-16">
    <Icon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
    <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);

const PollsView = ({ userRole = "student" }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [votingInProgress, setVotingInProgress] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id || currentUser._id;

  console.log("Current User:", currentUser);
  console.log("Current User ID:", currentUserId);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/polls", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) throw new Error("Failed to fetch polls");
      
      const data = await response.json();
      console.log("Fetched polls data:", data);
      
      const pollsList = Array.isArray(data) ? data : data.polls || [];
      
      // Filter to active polls only
      const now = new Date();
      const activePolls = pollsList.filter(
        (p) => (p.status === "active" || p.active) && new Date(p.endDate) > now
      );
      
      console.log("Active polls:", activePolls);
      setPolls(activePolls);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError("Failed to load polls. Please refresh the page.");
      setLoading(false);
    }
  };

  const handleVote = async (pollId, vendorId, vendorName) => {
    if (votingInProgress) return;
    
    setError("");
    setSuccessMessage("");
    setVotingInProgress(true);

    console.log("Voting:", { pollId, vendorId, vendorName });

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5001/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendorId }),
      });

      const data = await response.json();
      console.log("Vote response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Vote failed");
      }

      // Update the poll in state with the new data
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? data.poll : p))
      );
      
      setSuccessMessage(`✓ You voted for ${vendorName}!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
      
    } catch (err) {
      console.error("Vote error:", err);
      setError(err.message || "Failed to submit vote. Please try again.");
    } finally {
      setVotingInProgress(false);
    }
  };

  // Handle voting for option-based polls
  const handleVoteOption = async (pollId, optionId, optionText) => {
    if (votingInProgress) return;
    
    setError("");
    setSuccessMessage("");
    setVotingInProgress(true);

    console.log("Voting for option:", { pollId, optionId, optionText });

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5001/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ selectedOption: optionId }),
      });

      const data = await response.json();
      console.log("Vote response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Vote failed");
      }

      // Update the poll in state with the new data
      setPolls((prev) =>
        prev.map((p) => (p._id === pollId ? data.poll : p))
      );
      
      setSuccessMessage(`✓ You voted for ${optionText}!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
      
    } catch (err) {
      console.error("Vote error:", err);
      setError(err.message || "Failed to submit vote. Please try again.");
    } finally {
      setVotingInProgress(false);
    }
  };

  // Helper function to check if user has voted in a poll
  const hasUserVotedInPoll = (poll) => {
    if (!currentUserId || !poll) return false;
    
    try {
      if (poll.pollType === 'vendor_voting' && poll.vendors && Array.isArray(poll.vendors)) {
        const voted = poll.vendors.some(vendor => {
          if (!vendor || !vendor.votedBy || !Array.isArray(vendor.votedBy)) return false;
          
          return vendor.votedBy.some(id => {
            if (!id) return false;
            try {
              const idStr = typeof id === 'object' && id._id 
                ? id._id.toString() 
                : id.toString();
              const currentUserIdStr = currentUserId.toString();
              return idStr === currentUserIdStr;
            } catch (err) {
              return false;
            }
          });
        });
        return voted;
      }
    } catch (err) {
      console.error("Error checking if user voted:", err);
    }
    
    return false;
  };

  // Helper function to get which vendor the user voted for
  const getUserVotedVendor = (poll) => {
    if (!currentUserId || !poll || !poll.vendors) return null;
    
    try {
      const votedVendor = poll.vendors.find(vendor => {
        if (!vendor || !vendor.votedBy || !Array.isArray(vendor.votedBy)) return false;
        
        return vendor.votedBy.some(id => {
          if (!id) return false;
          try {
            const idStr = typeof id === 'object' && id._id 
              ? id._id.toString() 
              : id.toString();
            const currentUserIdStr = currentUserId.toString();
            return idStr === currentUserIdStr;
          } catch (err) {
            return false;
          }
        });
      });
      
      return votedVendor ? votedVendor._id : null;
    } catch (err) {
      console.error("Error getting user voted vendor:", err);
      return null;
    }
  };

  if (loading) return <CardSkeleton count={3} />;

  return (
    <div className="space-y-7 max-w-9xl mx-auto px-4 py-8">
      <div className="text-left">
        <h1 style={{
                    fontSize: "2.5rem",
                    fontWeight: "800",
                    color: EOcolors.secondary,
                    margin: "0 0 0.5rem 0",
                    letterSpacing: "-0.02em",
                  }}>Vendor Polls</h1>
        <p className="text-lg text-gray-700">Vote for your favorite campus vendors!</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-700 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {polls.length === 0 && !error && (
        <EmptyState
          icon={Store}
          title="No Active Polls"
          description="Check back later for vendor voting!"
        />
      )}

      {/* Polls List */}
      {polls.map((poll) => {
        console.log("Rendering poll:", poll);
        
        // FIXED: Handle both vendor array structure AND options-based structure
        const hasVendorsArray = poll.vendors && poll.vendors.length > 0;
        const hasOptionsArray = poll.options && poll.options.length > 0;
        const isVendorPoll = (poll.pollType === 'vendor_voting' || poll.pollType === 'vendor_booth_setup') 
                           && (hasVendorsArray || hasOptionsArray);
        
        console.log("Poll check:", { 
          pollType: poll.pollType, 
          hasVendorsArray, 
          hasOptionsArray, 
          isVendorPoll 
        });
        
        // Handle options-based polls (your current structure)
        if (isVendorPoll && hasOptionsArray && !hasVendorsArray) {
          const totalVotes = poll.options.reduce((s, o) => s + (o.votes || 0), 0);
          
          // Check if user has voted - with comprehensive null checks
          const userHasVoted = poll.votes && Array.isArray(poll.votes) && poll.votes.some(v => {
            if (!v || !v.userId) return false;
            try {
              const vUserIdStr = typeof v.userId === 'object' && v.userId._id 
                ? v.userId._id.toString() 
                : v.userId.toString();
              const currentUserIdStr = currentUserId.toString();
              return vUserIdStr === currentUserIdStr;
            } catch (err) {
              console.error("Error comparing user IDs:", err);
              return false;
            }
          });
          
          // Get user's voted option - with comprehensive null checks
          const userVote = userHasVoted && poll.votes ? poll.votes.find(v => {
            if (!v || !v.userId) return false;
            try {
              const vUserIdStr = typeof v.userId === 'object' && v.userId._id 
                ? v.userId._id.toString() 
                : v.userId.toString();
              const currentUserIdStr = currentUserId.toString();
              return vUserIdStr === currentUserIdStr;
            } catch (err) {
              return false;
            }
          }) : null;
          const userVotedOptionId = userVote?.selectedOption;

          return (
            <>
              <style>{`
                @keyframes slideInDown {
                  from { opacity: 0; transform: translateY(-20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY( = 0); }
                }
                .poll-card { animation: slideInDown 0.4s ease-out; }
                .option-card {
                  animation: slideInUp 0.35s ease-out;
                  transition: ${EOtransitions.normal};
                }
                .option-card:hover {
                  transform: translateY(-4px);
                  box-shadow: ${EOshadows.lg};
                  border-color: ${EOcolors.primary};
                }
                .vote-bar {
                  animation: slideInLeft 0.8s ease-out;
                  background: linear-gradient(90deg, ${EOcolors.primary}, ${EOcolors.tertiary});
                }
                @keyframes slideInLeft {
                  from { width: 0; }
                  to { width: var(--width, 0%); }
                }
              `}</style>
          
              <div
                key={poll._id}
                className="poll-card"
                style={{
                  maxWidth: "110rem",
                  margin: "2rem auto",
                  ...EOcardStyles.base,
                  border: `2px solid ${EOcolors.primary}`,
                  borderRadius: EOradius.xl,
                }}
              >
                {/* Header */}
                <div style={{ padding: "1.75rem 2rem", background: EOcolors.primary + "08", borderBottom: `1px solid ${EOcolors.lightSilver}` }}>
                  <h2 style={{
                    fontSize: "1.875rem",
                    fontWeight: "800",
                    color: EOcolors.secondary,
                    margin: "0 0 0.5rem 0",
                    letterSpacing: "-0.02em",
                  }}>
                    {poll.title}
                  </h2>
                  {poll.description && (
                    <p style={{
                      color: EOcolors.text.secondary,
                      margin: "0 0 1rem 0",
                      fontSize: "1rem",
                      lineHeight: "1.5",
                    }}>
                      {poll.description}
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.9375rem", color: EOcolors.text.muted }}>
                    <span>Event: {poll.eventName || "Campus Event"}</span>
                    <span>Ends: {new Date(poll.endDate).toLocaleDateString()}</span>
                    <span style={{ fontWeight: "600", color: EOcolors.primary }}>
                      {totalVotes} total votes
                    </span>
                  </div>
                </div>
          
                {/* Thank You Banner */}
                {userHasVoted && (
                  <div style={{
                    ...EOalertStyles.success,
                    margin: "1.5rem 2rem 0",
                    padding: "1rem",
                    borderRadius: EOradius.lg,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}>
                    <CheckCircle className="w-6 h-6" />
                    <span style={{ fontWeight: "600" }}>Thank you for voting!</span>
                  </div>
                )}
          
                {/* Options Grid */}
                <div style={{ padding: "2rem" }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {poll.options.map((option) => {
                      const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                      const isVotedByUser = userVotedOptionId === option.optionId;
                      const isLeading = option.votes === Math.max(...poll.options.map(o => o.votes || 0));
          
                      return (
                        <div
                          key={option.optionId}
                          className="option-card"
                          style={{
                            padding: "1.5rem",
                            background: "white",
                            border: `2px solid ${isVotedByUser ? EOcolors.primary : EOcolors.lightSilver}`,
                            borderRadius: EOradius.lg,
                            position: "relative",
                            overflow: "visible",
                            boxShadow: isVotedByUser ? EOshadows.md : EOshadows.sm,
                            transform: isVotedByUser ? "translateY(-4px)" : "none",
                          }}
                        >
                          {/* Leading Badge */}
                          {isLeading && option.votes > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "0.5rem",
                              left: "0.5rem",
                              ...EObadgeStyles.success,
                              fontSize: "0.75rem",
                              padding: "0.25rem 0.5rem",
                            }}>
                              Leading
                            </div>
                          )}
          
                          {/* Green Check Badge – FULLY OUTSIDE & PERFECTLY VISIBLE */}
{isVotedByUser && (
  <div
    style={{
      position: "absolute",
      top: "-1.5rem",     // moved higher
      right: "-1.5rem",   // moved further right
      background: EOcolors.success,
      color: "white",
      borderRadius: "50%",
      width: "4.5rem",
      height: "4.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 10px 30px ${EOcolors.success}60`,
      border: "6px solid white",   // thick white border = clean cutout effect
      zIndex: 50,                  // above everything
      pointerEvents: "none",       // doesn't block hover
    }}
  >
    <CheckCircle className="w-12 h-12 drop-shadow-lg" />
  </div>
)}
          
                          {/* Vendor Icon */}
                          <div style={{
                            width: "5.5rem",
                            height: "5.5rem",
                            borderRadius: EOradius.xl,
                            background: `linear-gradient(135deg, ${EOcolors.light}, ${EOcolors.pastel}40)`,
                            border: `2px dashed ${EOcolors.lightSilver}`,
                            margin: "0 auto 1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Store className="w-12 h-12" style={{ color: EOcolors.primary }} />
                          </div>
          
                          {/* Vendor Name */}
                          <h3 style={{
                            fontSize: "1.25rem",
                            fontWeight: "800",
                            color: EOcolors.secondary,
                            textAlign: "center",
                            margin: "0 0 0.5rem 0",
                          }}>
                            {option.optionText}
                          </h3>
                          <p style={{
                            textAlign: "center",
                            color: EOcolors.text.secondary,
                            fontSize: "0.9375rem",
                            margin: "0 0 1.25rem 0",
                          }}>
                            Vendor
                          </p>
          
                          {/* Vote Count + Percentage */}
                          <div style={{ marginBottom: "1rem" }}>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.5rem",
                            }}>
                              <span style={{
                                fontSize: "1.875rem",
                                fontWeight: "800",
                                color: EOcolors.primary,
                              }}>
                                {option.votes || 0}
                              </span>
                              <span style={{
                                ...EObadgeStyles.primary,
                                fontSize: "1rem",
                                padding: "0.5rem 1rem",
                              }}>
                                {percentage}%
                              </span>
                            </div>
          
                            {/* Progress Bar */}
                            <div style={{
                              height: "0.75rem",
                              background: EOcolors.lightSilver,
                              borderRadius: EOradius.full,
                              overflow: "hidden",
                            }}>
                              <div
                                className="vote-bar"
                                style={{
                                  "--width": `${percentage}%`,
                                  height: "100%",
                                }}
                              />
                            </div>
                          </div>
          
                          {/* Vote Button or Status – NOW WITH SPECIAL "YOUR VOTE" DESIGN */}
{!userHasVoted ? (
  <button
    onClick={() => handleVoteOption(poll._id, option.optionId, option.optionText)}
    disabled={votingInProgress}
    style={{
      ...EObuttonStyles.primary,
      width: "100%",
      padding: "1rem",
      fontSize: "1.0625rem",
      fontWeight: "700",
      opacity: votingInProgress ? 0.6 : 1,
      cursor: votingInProgress ? "not-allowed" : "pointer",
      transition: "all 0.3s ease",
    }}
  >
    {votingInProgress ? "Voting..." : `Vote for ${option.optionText}`}
  </button>
) : isVotedByUser ? (
  /* SPECIAL "YOUR VOTE" BADGE – LOOKS AMAZING */
  <div
    style={{
      width: "100%",
      padding: "1.25rem 1rem",
      background: `linear-gradient(135deg, ${EOcolors.success}10, ${EOcolors.success}05)`,
      border: `3px solid ${EOcolors.success}`,
      borderRadius: EOradius.xl,
      textAlign: "center",
      fontSize: "1.125rem",
      fontWeight: "800",
      color: EOcolors.success,
      letterSpacing: "0.5px",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 8px 25px ${EOcolors.success}30`,
    }}
  >
    {/* Animated shine effect */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "50%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        transform: "skewX(-25deg)",
        animation: "shine 3 3s infinite",
      }}
    />

    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
      <CheckCircle className="w-7 h-7" style={{ color: EOcolors.success }} />
      <span>Your Vote</span>
      <CheckCircle className="w-7 h-7" style={{ color: EOcolors.success }} />
    </div>
  </div>
) : (
  <div
    style={{
      width: "100%",
      padding: "1rem",
      background: EOcolors.light,
      color: EOcolors.text.muted,
      border: `2px dashed ${EOcolors.lightSilver}`,
      borderRadius: EOradius.lg,
      textAlign: "center",
      fontWeight: "600",
      fontSize: "1rem",
      opacity: 0.7,
    }}
  >
    Not Selected
  </div>
)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          );
        }
        
        // Show message if poll has no vendors or options
        if (isVendorPoll && !hasVendorsArray && !hasOptionsArray) {
          return (
            <div key={poll._id} className="bg-white rounded-2xl shadow-2xl border-2 border-orange-300 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                <h2 className="text-3xl font-bold mb-2">{poll.title}</h2>
                {poll.description && (
                  <p className="text-white/90 mb-3">{poll.description}</p>
                )}
              </div>
              <div className="p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Vendors Available</h3>
                <p className="text-gray-600">This poll hasn't been set up with any vendors yet.</p>
                <p className="text-sm text-gray-500 mt-2">Contact the Events Office to add vendors to this poll.</p>
              </div>
            </div>
          );
        }
        
        if (isVendorPoll && poll.vendors.length > 0) {
          const totalVotes = poll.vendors.reduce((s, v) => s + (v.votes || 0), 0);
          const userHasVoted = hasUserVotedInPoll(poll);
          const userVotedVendorId = getUserVotedVendor(poll);

          console.log("Poll details:", {
            pollId: poll._id,
            title: poll.title,
            vendorCount: poll.vendors.length,
            totalVotes,
            userHasVoted,
            userVotedVendorId
          });

          return (
            <div key={poll._id} className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
              {/* Poll Header */}
              <div className="bg-gradient-to-r from-[#307B8E] to-[#245968] text-white p-6">
                <h2 className="text-3xl font-bold mb-2">{poll.title}</h2>
                {poll.description && (
                  <p className="text-white/90 mb-3">{poll.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-white/80">
                  <span>📅 {poll.eventName || "Campus Event"}</span>
                  <span>⏰ Ends: {new Date(poll.endDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    {totalVotes} total votes
                  </span>
                </div>
              </div>

              {/* Poll Content */}
              <div className="p-8">
                {userHasVoted && (
                  <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-xl p-5 text-center shadow-sm">
                    <CheckCircle className="inline w-7 h-7 mr-2 text-green-600" />
                    <span className="text-green-800 font-bold text-xl">
                      Thank you for voting!
                    </span>
                  </div>
                )}

                {/* Vendor Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {poll.vendors.map((vendor) => {
                    const percentage = totalVotes > 0 ? Math.round((vendor.votes / totalVotes) * 100) : 0;
                    const isVotedByUser = userVotedVendorId && vendor._id.toString() === userVotedVendorId.toString();

                    return (
                      <div
                        key={vendor._id}
                        className={`relative p-6 rounded-2xl border-3 text-center transition-all duration-300 ${
                          isVotedByUser
                            ? "border-green-500 bg-green-50 shadow-xl scale-105"
                            : "border-gray-300 bg-white hover:border-[#307B8E] hover:shadow-xl hover:scale-102"
                        }`}
                      >
                        {/* Voted Badge */}
                        {isVotedByUser && (
                          <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3 shadow-lg z-10">
                            <CheckCircle className="w-7 h-7" />
                          </div>
                        )}

                        {/* Vendor Icon */}
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-3 border-dashed border-gray-400 rounded-2xl w-28 h-28 mx-auto mb-5 flex items-center justify-center shadow-inner">
                          <Store className="w-14 h-14 text-gray-600" />
                        </div>
                        
                        {/* Vendor Info */}
                        <h3 className="font-bold text-2xl mb-2 text-gray-900">{vendor.name}</h3>
                        <p className="text-gray-600 text-base mb-5 font-medium">{vendor.category || "Vendor"}</p>

                        {/* Vote Stats */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl font-bold text-[#307B8E]">{vendor.votes || 0}</span>
                            <span className="text-base font-semibold text-gray-700 bg-gray-200 px-4 py-1.5 rounded-full">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden shadow-inner">
                            <div
                              className={`h-4 rounded-full transition-all duration-700 ease-out ${
                                isVotedByUser ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-[#307B8E] to-[#245968]'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Vote Button */}
                        {!userHasVoted ? (
                          <button
                            onClick={() => handleVote(poll._id, vendor._id, vendor.name)}
                            disabled={votingInProgress}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-200 shadow-lg ${
                              votingInProgress
                                ? "bg-gray-400 cursor-wait"
                                : "bg-gradient-to-r from-[#307B8E] to-[#245968] hover:from-[#245968] hover:to-[#1a3d4a] active:scale-95 cursor-pointer"
                            }`}
                          >
                            {votingInProgress ? "Processing..." : `Vote for ${vendor.name}`}
                          </button>
                        ) : isVotedByUser ? (
                          <div className="w-full py-4 rounded-xl font-bold text-lg text-green-800 bg-green-200 border-2 border-green-500 shadow-md">
                            ✓ Your Choice
                          </div>
                        ) : (
                          <div className="w-full py-4 rounded-xl font-medium text-lg text-gray-600 bg-gray-100 border-2 border-gray-300">
                            Not Selected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // This is not a vendor voting poll - skip it or handle differently
        return null;
      })}
    </div>
  );
};

export default PollsView;