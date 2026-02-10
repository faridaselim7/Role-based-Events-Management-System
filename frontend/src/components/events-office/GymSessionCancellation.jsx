import React, { useState } from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import {
  EOcolors,
  EObuttonStyles,
  EOcardStyles,
  EOalertStyles,
  EOradius,
  EOtransitions,
  getCitronGlowEffect,
} from "../../styles/EOdesignSystem";

const GymSessionCancellation = ({ session, onCancel, onClose }) => {
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmField, setShowConfirmField] = useState(false);

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
          width: "90%",
          textAlign: "center",
        }}>
          <p style={{ color: EOcolors.text.secondary }}>No session data available</p>
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    setError(null);

    if (confirmText !== "CANCEL SESSION") {
      setError("Please confirm by typing 'CANCEL SESSION'");
      return;
    }

    setCanceling(true);
    try {
      const res = await fetch(`/api/gym-sessions/${session._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to cancel session");
      
      onCancel?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (e) {
      setError(e.message);
      setCanceling(false);
    }
  };

  const sessionDate = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .modal-content { animation: modalSlideIn 0.3s ease-out; }
        .warning-icon { animation: pulse 2s ease-in-out infinite; }
        .confirm-field {
          transition: ${EOtransitions.normal};
          animation: slideInUp 0.4s ease-out;
        }
        .confirm-field:focus {
          border-color: ${EOcolors.citron} !important;
          box-shadow: 0 0 0 4px ${EOcolors.citron}30 !important;
          background-color: #FFFDF0 !important;
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .btn-danger-glow {
          transition: ${EOtransitions.normal};
        }
        .btn-danger-glow:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 24px ${EOcolors.error}60, inset 0 0 24px ${EOcolors.error}20;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <div
          className="modal-content"
          style={{
            ...EOcardStyles.base,
            maxWidth: "36rem",
            width: "90%",
            position: "relative",
            border: `2px solid ${EOcolors.error}`,
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

          {/* Warning Icon & Header */}
          <div style={{
            textAlign: "center",
            marginBottom: "2rem",
            paddingRight: "2rem",
          }}>
            <div
              className="warning-icon"
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: EOradius.xl,
                background: `${EOcolors.error}20`,
                margin: "0 auto 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ExclamationTriangleIcon
                style={{
                  width: "2rem",
                  height: "2rem",
                  color: EOcolors.error,
                }}
              />
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: EOcolors.secondary,
                margin: "0 0 0.5rem 0",
              }}
            >
              Cancel Gym Session?
            </h2>
            <p
              style={{
                color: EOcolors.text.secondary,
                margin: 0,
                fontSize: "0.9375rem",
              }}
            >
              This action cannot be undone. All participants will be notified.
            </p>
          </div>

          {/* Session Details */}
          <div
            style={{
              padding: "1rem",
              background: EOcolors.light,
              border: `2px solid ${EOcolors.lightSilver}`,
              borderRadius: EOradius.lg,
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.9375rem",
                }}
              >
                <span style={{ color: EOcolors.text.secondary, fontWeight: "600" }}>
                  Date
                </span>
                <span style={{ color: EOcolors.secondary, fontWeight: "700" }}>
                  {sessionDate}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.9375rem",
                }}
              >
                <span style={{ color: EOcolors.text.secondary, fontWeight: "600" }}>
                  Time
                </span>
                <span style={{ color: EOcolors.secondary, fontWeight: "700" }}>
                  {session.startTime} - {session.endTime}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.9375rem",
                }}
              >
                <span style={{ color: EOcolors.text.secondary, fontWeight: "600" }}>
                  Location
                </span>
                <span style={{ color: EOcolors.secondary, fontWeight: "700" }}>
                  {session.location || "GYM"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                ...EOalertStyles.error,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <span style={{ marginTop: "0.125rem" }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Impact Warning */}
          <div
            style={{
              padding: "1rem",
              background: "#FEE2E2",
              border: `2px solid ${EOcolors.error}`,
              borderRadius: EOradius.lg,
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#7F1D1D",
                fontSize: "0.875rem",
                lineHeight: "1.5",
                fontWeight: "500",
              }}
            >
              ⚠️ <strong>Impact:</strong> All registered participants will receive a cancellation notification. Participant payments will be refunded automatically.
            </p>
          </div>

          {/* Confirmation Section */}
          {!showConfirmField ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  color: EOcolors.text.secondary,
                  fontSize: "0.9375rem",
                  fontWeight: "500",
                  marginBottom: "1rem",
                }}
              >
                To proceed with cancellation, click the button below:
              </p>
              <button
                onClick={() => setShowConfirmField(true)}
                style={{
                  width: "100%",
                  ...EObuttonStyles.danger,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <ExclamationTriangleIcon style={{ width: "1.125rem", height: "1.125rem" }} />
                I want to cancel this session
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  color: EOcolors.secondary,
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Type to confirm: CANCEL SESSION
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Type: CANCEL SESSION"
                className="confirm-field"
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  border: `2px solid ${EOcolors.citron}`,
                  borderRadius: EOradius.lg,
                  fontSize: "0.9375rem",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  color: EOcolors.secondary,
                  backgroundColor: "white",
                  fontFamily: "monospace",
                }}
                autoFocus
              />
              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  fontSize: "0.8125rem",
                  color: EOcolors.text.secondary,
                }}
              >
                {confirmText.length}/15 characters
              </p>
            </div>
          )}

          {/* Citron Alert Banner - Only shows when confirm field is visible */}
          {showConfirmField && (
            <div
              style={{
                ...EOalertStyles.citron,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                border: `2px solid ${EOcolors.citron}`,
                background: "#F9FF9F",
              }}
            >
              <span>✨</span>
              <span style={{ fontWeight: "600" }}>
                Ready to cancel. Click the button below to proceed.
              </span>
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <button
              onClick={onClose}
              style={{
                ...EObuttonStyles.outline,
                width: "100%",
                transition: EOtransitions.normal,
              }}
            >
              Keep Session
            </button>
            <button
              onClick={handleCancel}
              disabled={!showConfirmField || confirmText !== "CANCEL SESSION" || canceling}
              className="btn-danger-glow"
              style={{
                ...EObuttonStyles.danger,
                width: "100%",
                opacity:
                  !showConfirmField || confirmText !== "CANCEL SESSION" || canceling
                    ? 0.5
                    : 1,
                cursor:
                  !showConfirmField || confirmText !== "CANCEL SESSION" || canceling
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {canceling ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      animation: "spin 1s linear infinite",
                      width: "1rem",
                      height: "1rem",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                    }}
                  />
                  Canceling...
                </span>
              ) : (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <ExclamationTriangleIcon
                    style={{ width: "1.125rem", height: "1.125rem" }}
                  />
                  Cancel Session
                </span>
              )}
            </button>
          </div>

          {/* Info Footer */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: `1px solid ${EOcolors.lightSilver}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: EOcolors.text.muted,
                fontSize: "0.8125rem",
              }}
            >
              Need help? Contact events office support for assistance.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GymSessionCancellation;
