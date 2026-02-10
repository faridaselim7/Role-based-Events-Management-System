// src/components/events-office/BoothSetupPoll.jsx
import React, { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon
} from "@heroicons/react/24/solid";
import { CardSkeleton, NoPollsState } from "../LoadingEmptyStates";
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
} from "../../styles/EOdesignSystem";

const BoothSetupPoll = ({
  userRole = "Student",
  pollId,
  onPollCreated,
}) => {
  const [options, setOptions] = useState([]);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const canVote = ["Student", "Staff", "TA", "Professor"].includes(userRole);
  const isCreator = ["EventsOffice", "eventsoffice", "events_office", "Events Office"].includes(userRole);
  const [isCreating, setIsCreating] = useState(!pollId && isCreator);
  const [newOptions, setNewOptions] = useState([{ text: "" }, { text: "" }]);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");

  useEffect(() => {
    if (pollId && canVote) fetchPollData();
  }, [pollId, canVote]);

  useEffect(() => {
    if (pollId && canVote) fetchPollData();
  }, [pollId, canVote]);

  const fetchPollData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        credentials: "include"  // ← ADD THIS LINE
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch poll");
      }
      const data = await res.json();
      setOptions(data.options || []);
      setPollTitle(data.title || "Booth Setup Poll");
      setPollDescription(data.description || "");
      setVoted(data.votes?.some(v => v.userId === "current") || false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId) => {
    if (voted || !canVote) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        credentials: "include",  // ADD THIS
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOption: optionId }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const data = await res.json();
      setOptions(data.options || []);
      setVoted(true);
      setSuccessMessage("Your vote has been recorded! Thank you for participating.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => setNewOptions([...newOptions, { text: "" }]);
  const removeOption = (i) =>
    newOptions.length > 2 && setNewOptions(newOptions.filter((_, x) => x !== i));
  const updateOption = (i, txt) => {
    const copy = [...newOptions];
    copy[i].text = txt;
    setNewOptions(copy);
  };

  const createPoll = async () => {
    const validOptions = newOptions
      .map(o => o.text.trim())
      .filter(text => text.length > 0);
  
    if (validOptions.length < 2) {
      return setError("Please add at least 2 vendor names");
    }
    if (!pollTitle.trim()) {
      return setError("Poll title is required");
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem("token"); // You have it here
  
      const response = await fetch("/api/polls", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // THIS LINE WAS MISSING — THIS IS THE FINAL FIX
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: pollTitle.trim(),
          description: pollDescription.trim(),
          pollType: "vendor_booth_setup",
          options: validOptions,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          allowMultipleVotes: false,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
  
      const data = await response.json();
      setSuccessMessage("Poll created successfully!");
      setIsCreating(false);
      onPollCreated?.(data.poll);
    } catch (err) {
      console.error("Create poll failed:", err);
      setError(err.message || "Failed to create poll.");
    } finally {
      setLoading(false);
    }
  };

  // ========== EventsOffice: Creation UI ==========
  if (isCreator && isCreating) {
    return (
      <>
        <style>{`
          @keyframes slideInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .poll-container { animation: slideInDown 0.4s ease-out; }
          .form-input { transition: ${EOtransitions.normal}; }
          .form-input:hover { border-color: ${EOcolors.pastel}; }
          .form-input:focus {
            border-color: ${EOcolors.primary};
            box-shadow: 0 0 0 4px ${EOcolors.primary}15;
            background-color: ${EOcolors.light};
          }
          .option-input-container { animation: slideInDown 0.3s ease-out; }
          .btn-add-option {
            transition: ${EOtransitions.normal};
          }
          .btn-add-option:hover {
            border-color: ${EOcolors.primary};
            background-color: ${EOcolors.primary}08;
            transform: translateY(-2px);
          }
          .btn-create {
            transition: ${EOtransitions.normal};
          }
          .btn-create:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px ${EOcolors.primary}30;
          }
          .btn-remove {
            transition: ${EOtransitions.normal};
          }
          .btn-remove:hover {
            background-color: ${EOcolors.error}20;
            transform: scale(1.05);
          }
        `}</style>

        <div className="poll-container" style={{
          maxWidth: "100rem",
          margin: "2rem auto",
          ...EOcardStyles.base,
          border: `2px solid ${EOcolors.primary}`,
        }}>
          {/* Header with Icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{
              width: "3rem",
              height: "3rem",
              borderRadius: EOradius.xl,
              background: `linear-gradient(135deg, ${EOcolors.primary}20, ${EOcolors.tertiary}20)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <SparklesIcon style={{ width: "1.5rem", height: "1.5rem", color: EOcolors.primary }} />
            </div>
            <div>
              <h2 style={{
                fontSize: "1.75rem",
                fontWeight: "800",
                color: EOcolors.secondary,
                margin: "0 0 0.25rem 0",
                letterSpacing: "-0.01em",
              }}>
                Create Booth Poll
              </h2>
              <p style={{ margin: 0, color: EOcolors.text.secondary, fontSize: "0.9375rem" }}>
                Let vendors compete for the best booth setup
              </p>
            </div>
          </div>

          {/* Poll Title */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={EOformStyles.label}>Poll Title *</label>
            <input
              type="text"
              value={pollTitle}
              onChange={(e) => setPollTitle(e.target.value)}
              placeholder="E.g., Select vendor for main hall booth"
              className="form-input"
              style={{
                ...EOformStyles.base,
                fontSize: "1rem",
              }}
            />
          </div>

          {/* Poll Description */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={EOformStyles.label}>Description</label>
            <textarea
              value={pollDescription}
              onChange={(e) => setPollDescription(e.target.value)}
              placeholder="Optional: Add details about the poll, venue, dates, etc."
              className="form-input"
              rows="3"
              style={{
                ...EOformStyles.base,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          {/* Options */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={EOformStyles.label}>Vendor Options * (Min 2)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {newOptions.map((opt, i) => (
                <div key={i} className="option-input-container" style={{
                  display: "flex",
                  gap: "0.5rem",
                  alignItems: "center",
                }}>
                  <div style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: EOradius.md,
                    background: EOcolors.tertiary,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "0.875rem",
                  }}>
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={opt.text || ""}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Vendor ${i + 1} name`}
                    className="form-input"
                    style={{
                      ...EOformStyles.base,
                      flex: 1,
                    }}
                  />
                  {newOptions.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="btn-remove"
                      title="Remove option"
                      style={{
                        padding: "0.5rem",
                        background: EOcolors.error,
                        border: "none",
                        borderRadius: EOradius.md,
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <TrashIcon style={{ width: "1.125rem", height: "1.125rem" }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Option Button */}
          <button
            onClick={addOption}
            className="btn-add-option"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.875rem",
              border: `2px dashed ${EOcolors.lightSilver}`,
              borderRadius: EOradius.lg,
              background: "white",
              color: EOcolors.primary,
              fontWeight: "600",
              fontSize: "0.9375rem",
              cursor: "pointer",
              marginBottom: "1.5rem",
            }}
          >
            <PlusIcon style={{ width: "1.25rem", height: "1.25rem" }} />
            Add Another Vendor
          </button>

          {/* Error Message */}
          {error && (
            <div style={{
              ...EOalertStyles.error,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              ...EOalertStyles.success,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <CheckCircleIcon style={{ width: "1.25rem", height: "1.25rem" }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={createPoll}
            disabled={loading}
            className="btn-create"
            style={{
              ...EObuttonStyles.primary,
              width: "100%",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <div style={{
                  animation: "spin 1s linear infinite",
                  width: "1rem",
                  height: "1rem",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }} />
                Creating Poll...
              </span>
            ) : (
              "Create Poll"
            )}
          </button>
        </div>
      </>
    );
  }

  // ========== EventsOffice: View Results ==========
  if (isCreator && pollId) {
    if (loading && options.length === 0)
      return (
        <div style={{ maxWidth: "45rem", margin: "2rem auto" }}>
          <CardSkeleton count={1} />
        </div>
      );

    if (options.length === 0) {
      return (
        <div style={{ maxWidth: "45rem", margin: "2rem auto" }}>
          <NoPollsState />
        </div>
      );
    }

    return (
      <>
        <style>{`
          .results-container { animation: slideInDown 0.4s ease-out; }
          .option-result {
            transition: ${EOtransitions.normal};
            animation: slideInUp 0.3s ease-out;
          }
          .option-result:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 16px ${EOcolors.primary}20;
          }
          .vote-bar {
            animation: slideInLeft 0.6s ease-out;
            background: linear-gradient(90deg, ${EOcolors.primary}, ${EOcolors.tertiary});
            transition: ${EOtransitions.normal};
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { width: 0; }
            to { width: var(--vote-percentage, 0%); }
          }
        `}</style>

        <div className="results-container" style={{
          maxWidth: "45rem",
          margin: "2rem auto",
          ...EOcardStyles.base,
          border: `2px solid ${EOcolors.primary}`,
        }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{
              fontSize: "1.75rem",
              fontWeight: "800",
              color: EOcolors.secondary,
              margin: "0 0 0.5rem 0",
            }}>
              {pollTitle}
            </h2>
            {pollDescription && (
              <p style={{
                color: EOcolors.text.secondary,
                margin: 0,
                fontSize: "0.9375rem",
              }}>
                {pollDescription}
              </p>
            )}
          </div>

          {error && (
            <div style={{
              ...EOalertStyles.error,
              marginBottom: "1.5rem",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {options.map((opt, idx) => {
              const total = options.reduce((s, o) => s + (o.votes || 0), 0);
              const pct = total ? ((opt.votes / total) * 100).toFixed(1) : 0;
              const isLeading = idx === 0 && opt.votes === Math.max(...options.map(o => o.votes || 0));
              
              return (
                <div
                  key={opt.optionId}
                  className="option-result"
                  style={{
                    padding: "1rem",
                    background: EOcolors.light,
                    border: `2px solid ${isLeading ? EOcolors.primary : EOcolors.lightSilver}`,
                    borderRadius: EOradius.lg,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Leading Badge */}
                  {isLeading && (
                    <div style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      ...EObadgeStyles.success,
                      fontSize: "0.7rem",
                    }}>
                      Leading
                    </div>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                    position: "relative",
                    zIndex: 2,
                  }}>
                    <span style={{
                      fontWeight: "600",
                      color: EOcolors.secondary,
                      fontSize: "1rem",
                    }}>
                      {opt.optionText}
                    </span>
                    <span style={{
                      fontWeight: "700",
                      color: EOcolors.primary,
                      fontSize: "1.25rem",
                    }}>
                      {opt.votes} votes
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    height: "0.5rem",
                    background: EOcolors.lightSilver,
                    borderRadius: EOradius.full,
                    overflow: "hidden",
                  }}>
                    <div
                      className="vote-bar"
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        "--vote-percentage": `${pct}%`,
                      }}
                    />
                  </div>

                  <span style={{
                    display: "block",
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: EOcolors.text.secondary,
                    fontWeight: "600",
                  }}>
                    {pct}% of total votes
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: "2rem",
            padding: "1rem",
            background: EOcolors.tertiary + "15",
            border: `1px solid ${EOcolors.tertiary}`,
            borderRadius: EOradius.lg,
            textAlign: "center",
          }}>
            <p style={{
              margin: 0,
              color: EOcolors.text.secondary,
              fontSize: "0.9375rem",
            }}>
              Total Votes: <strong style={{ color: EOcolors.secondary }}>{options.reduce((s, o) => s + (o.votes || 0), 0)}</strong>
            </p>
          </div>
        </div>
      </>
    );
  }

  // ========== Voters: Voting UI ==========
  if (!canVote) {
    return (
      <div style={{
        maxWidth: "45rem",
        margin: "2rem auto",
        ...EOcardStyles.base,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "4rem",
            height: "4rem",
            borderRadius: EOradius.xl,
            background: EOcolors.error + "15",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ fontSize: "2rem" }}>🔒</span>
          </div>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: EOcolors.secondary,
            margin: "0 0 0.5rem 0",
          }}>
            Voting Not Available
          </h3>
          <p style={{
            color: EOcolors.text.secondary,
            margin: 0,
          }}>
            Only Students, Staff, TAs and Professors can vote in polls.
          </p>
        </div>
      </div>
    );
  }

  if (loading && options.length === 0)
    return (
      <div style={{ maxWidth: "45rem", margin: "2rem auto" }}>
        <CardSkeleton count={1} />
      </div>
    );

  if (options.length === 0) {
    return (
      <div style={{ maxWidth: "45rem", margin: "2rem auto" }}>
        <NoPollsState />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .voting-container { animation: slideInDown 0.4s ease-out; }
        .vendor-option {
          transition: ${EOtransitions.normal};
          animation: slideInUp 0.3s ease-out;
        }
        .vendor-option:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px ${EOcolors.primary}20;
          border-color: ${EOcolors.primary};
        }
        .vendor-option:active:not(:disabled) {
          transform: translateY(-1px);
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="voting-container" style={{
        maxWidth: "45rem",
        margin: "2rem auto",
        ...EOcardStyles.base,
        border: `2px solid ${EOcolors.primary}`,
      }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{
            fontSize: "1.75rem",
            fontWeight: "800",
            color: EOcolors.secondary,
            margin: "0 0 0.5rem 0",
          }}>
            {pollTitle}
          </h2>
          {pollDescription && (
            <p style={{
              color: EOcolors.text.secondary,
              margin: 0,
              fontSize: "0.9375rem",
            }}>
              {pollDescription}
            </p>
          )}
        </div>

        {error && (
          <div style={{
            ...EOalertStyles.error,
            marginBottom: "1.5rem",
          }}>
            {error}
          </div>
        )}

        {/* Vendor Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {options.map((opt, idx) => (
            <button
              key={opt.optionId}
              onClick={() => handleVote(opt.optionId)}
              disabled={voted || loading}
              className="vendor-option"
              style={{
                width: "100%",
                padding: "1.25rem 1.5rem",
                borderRadius: EOradius.lg,
                border: `2px solid ${EOcolors.lightSilver}`,
                background: "white",
                textAlign: "left",
                cursor: voted || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                opacity: voted && !opt.selected ? 0.7 : 1,
                transition: EOtransitions.normal,
              }}
            >
              {/* Option Number Circle */}
              <div style={{
                width: "2.5rem",
                height: "2.5rem",
                minWidth: "2.5rem",
                borderRadius: EOradius.md,
                background: `linear-gradient(135deg, ${EOcolors.primary}, ${EOcolors.tertiary})`,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "1.125rem",
              }}>
                {idx + 1}
              </div>

              {/* Vendor Name */}
              <span style={{
                flex: 1,
                fontWeight: "600",
                fontSize: "1.0625rem",
                color: EOcolors.secondary,
              }}>
                {opt.optionText}
              </span>

              {/* Vote Count & Check Icon */}
              {voted && opt.selected && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}>
                  <span style={{
                    fontWeight: "700",
                    color: EOcolors.primary,
                    fontSize: "1rem",
                  }}>
                    {opt.votes} votes
                  </span>
                  <CheckCircleIcon style={{
                    width: "1.5rem",
                    height: "1.5rem",
                    color: EOcolors.success,
                  }} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            ...EOalertStyles.success,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <CheckCircleIcon style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Voting Status Info */}
        {!voted && (
          <div style={{
            textAlign: "center",
            padding: "1rem",
            background: EOcolors.tertiary + "10",
            borderRadius: EOradius.lg,
            borderLeft: `4px solid ${EOcolors.tertiary}`,
          }}>
            <p style={{
              margin: 0,
              color: EOcolors.text.secondary,
              fontSize: "0.875rem",
              fontWeight: "500",
            }}>
              👆 Select your preferred vendor to set up a booth
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default BoothSetupPoll;