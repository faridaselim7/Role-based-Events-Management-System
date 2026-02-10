import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";
import { CardSkeleton } from "../LoadingEmptyStates";
import {
  EOcolors,
  EObuttonStyles,
  EOformStyles,
  EOcardStyles,
  EOalertStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
} from "../../styles/EOdesignSystem";

const GymSessionEditor = ({ sessionId, onSave, onClose }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form fields
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gym-sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      const data = await res.json();
      setSession(data);
      
      // Parse date and time
      const sessionDate = new Date(data.date);
      setDate(sessionDate.toISOString().split('T')[0]);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === "date") setDate(value);
    else if (field === "startTime") setStartTime(value);
    else if (field === "endTime") setEndTime(value);
    setHasChanges(true);
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [sHours, sMinutes] = startTime.split(":").map(Number);
    const [eHours, eMinutes] = endTime.split(":").map(Number);
    const start = sHours * 60 + sMinutes;
    const end = eHours * 60 + eMinutes;
    return Math.max(0, end - start);
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (!date || !startTime || !endTime) {
      setError("All fields are required");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/gym-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startTime,
          endTime,
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const data = await res.json();
      setSession(data);
      setHasChanges(false);
      setSuccessMessage("Session updated successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
        onSave?.(data);
      }, 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(4px)",
      }}>
        <div style={{
          ...EOcardStyles.base,
          maxWidth: "32rem",
          width: "90%",
        }}>
          <CardSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        backdropFilter: "blur(4px)",
      }}>
        <div style={{
          ...EOcardStyles.base,
          maxWidth: "32rem",
          textAlign: "center",
        }}>
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
            <span style={{ fontSize: "2rem" }}>⚠️</span>
          </div>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: EOcolors.secondary,
            margin: "0 0 0.5rem 0",
          }}>
            Session Not Found
          </h3>
          <p style={{
            color: EOcolors.text.secondary,
            margin: "0 0 1.5rem 0",
          }}>
            The gym session could not be loaded.
          </p>
          <button
            onClick={onClose}
            style={{
              ...EObuttonStyles.secondary,
              width: "100%",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const duration = calculateDuration();
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <>
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes backdropFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        .modal-backdrop { animation: backdropFadeIn 0.3s ease-out; }
        .modal-content { animation: modalSlideIn 0.3s ease-out; }
        .form-input { transition: ${EOtransitions.normal}; }
        .form-input:hover { border-color: ${EOcolors.pastel}; }
        .form-input:focus {
          border-color: ${EOcolors.primary};
          box-shadow: 0 0 0 4px ${EOcolors.primary}15;
          background-color: ${EOcolors.light};
        }
        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px ${EOcolors.primary}30;
        }
        .btn-cancel:hover {
          background-color: ${EOcolors.lightSilver};
        }
        .duration-badge {
          background: linear-gradient(135deg, ${EOcolors.primary}20, ${EOcolors.tertiary}20);
          border: 2px solid ${EOcolors.tertiary};
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          className="modal-content"
          style={{
            ...EOcardStyles.base,
            maxWidth: "32rem",
            width: "90%",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              width: "2rem",
              height: "2rem",
              borderRadius: EOradius.md,
              background: EOcolors.light,
              border: "none",
              color: EOcolors.text.secondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: EOtransitions.normal,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = EOcolors.error;
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = EOcolors.light;
              e.currentTarget.style.color = EOcolors.text.secondary;
            }}
          >
            <XMarkIcon style={{ width: "1.25rem", height: "1.25rem" }} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: "2rem", paddingRight: "2rem" }}>
            <h2 style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              color: EOcolors.secondary,
              margin: "0 0 0.5rem 0",
            }}>
              Edit Gym Session
            </h2>
            <p style={{
              color: EOcolors.text.secondary,
              margin: 0,
              fontSize: "0.9375rem",
            }}>
              Modify date, time, and duration of the session
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              ...EOalertStyles.error,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}>
              <span style={{ marginTop: "0.125rem" }}>⚠️</span>
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
              <CheckIcon style={{ width: "1.25rem", height: "1.25rem" }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Date Field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={EOformStyles.label}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
                Session Date *
              </div>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              className="form-input"
              style={EOformStyles.base}
            />
          </div>

          {/* Time Fields */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            {/* Start Time */}
            <div>
              <label style={EOformStyles.label}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ClockIcon style={{ width: "1rem", height: "1rem" }} />
                  Start Time *
                </div>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleFieldChange("startTime", e.target.value)}
                className="form-input"
                style={EOformStyles.base}
              />
            </div>

            {/* End Time */}
            <div>
              <label style={EOformStyles.label}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ClockIcon style={{ width: "1rem", height: "1rem" }} />
                  End Time *
                </div>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleFieldChange("endTime", e.target.value)}
                className="form-input"
                style={EOformStyles.base}
              />
            </div>
          </div>

          {/* Duration Display */}
          {startTime && endTime && startTime < endTime && (
            <div
              className="duration-badge"
              style={{
                padding: "1rem",
                borderRadius: EOradius.lg,
                marginBottom: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{
                fontSize: "0.875rem",
                color: EOcolors.text.secondary,
                fontWeight: "600",
                marginBottom: "0.25rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Session Duration
              </div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: EOcolors.primary,
              }}>
                {hours > 0 && `${hours}h `}{minutes}m
              </div>
            </div>
          )}

          {/* Info Box */}
          <div style={{
            padding: "1rem",
            background: EOcolors.tertiary + "10",
            border: `2px solid ${EOcolors.tertiary}`,
            borderRadius: EOradius.lg,
            marginBottom: "1.5rem",
          }}>
            <p style={{
              margin: 0,
              color: EOcolors.text.secondary,
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}>
              💡 <strong>Note:</strong> You can only edit the date, start time, and end time. Other session details cannot be modified.
            </p>
          </div>

          {/* Buttons */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}>
            <button
              onClick={onClose}
              className="btn-cancel"
              style={{
                ...EObuttonStyles.outline,
                width: "100%",
                transition: EOtransitions.normal,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="btn-save"
              style={{
                ...EObuttonStyles.primary,
                width: "100%",
                opacity: !hasChanges || saving ? 0.6 : 1,
                cursor: !hasChanges || saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <div style={{
                    animation: "spin 1s linear infinite",
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                  }} />
                  Saving...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <CheckIcon style={{ width: "1.125rem", height: "1.125rem" }} />
                  Save Changes
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GymSessionEditor;
