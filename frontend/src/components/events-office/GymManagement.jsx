import { useState, useEffect } from "react";
import axios from "axios";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { exportRegistrationsToExcel } from "../../utils/exportToExcel";
import { TableSkeleton, NoGymSlotsState } from "../LoadingEmptyStates";
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
// import EventFilterSort from "../EventFilterSort"; // temporarily unused

const token = localStorage.getItem("token");
const roleHeader = {
  headers: {
    "x-role": "events_office",
    Authorization: `Bearer ${token}`,
  },
};

const TYPE_LABELS = {
  yoga: "Yoga",
  pilates: "Pilates",
  aerobics: "Aerobics",
  zumba: "Zumba",
  cross_circuit: "Cross Circuit",
  kick_boxing: "Kick-boxing",
};

export default function GymManagement() {
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filteredSessions, setFilteredSessions] = useState([]);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    durationMins: "",
    type: "yoga",
    maxParticipants: "",
    allowedUserTypes: [],
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5001/api/gym", roleHeader);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching gym sessions:", err);
      setError("Failed to fetch gym sessions");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      durationMins: "",
      type: "yoga",
      maxParticipants: "",
      allowedUserTypes: [],
    });
    setError(null);
  };

  const handleUserTypeToggle = (userType) => {
    setFormData((prev) => {
      const current = prev.allowedUserTypes || [];
      if (current.includes(userType)) {
        return { ...prev, allowedUserTypes: current.filter((t) => t !== userType) };
      } else {
        return { ...prev, allowedUserTypes: [...current, userType] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        date: formData.date,
        time: formData.time,
        durationMins: Number(formData.durationMins) || 0,
        type: formData.type,
        maxParticipants: Number(formData.maxParticipants) || 0,
        allowedUserTypes: formData.allowedUserTypes || [],
      };

      if (editing) {
        await axios.put(
          `http://localhost:5001/api/gym/${editing._id}/edit`,
          payload,
          roleHeader
        );
        setSuccessMessage("Session updated successfully!");
      } else {
        await axios.post("http://localhost:5001/api/gym", payload, roleHeader);
        setSuccessMessage("Session created successfully!");
      }

      setTimeout(() => {
        setOpen(false);
        setEditing(null);
        resetForm();
        setSuccessMessage(null);
        fetchSessions();
      }, 1500);
    } catch (err) {
      console.error("Error saving gym session:", err);
      const msg = err?.response?.data?.message || err.message || "Request failed";
      setError(msg);
    }
  };

  const handleEdit = (s) => {
    setEditing(s);

    let dateStr = "";
    let timeStr = "";

    if (s.date) {
      const d = new Date(s.date);
      dateStr = d.toISOString().split("T")[0];

      if (s.time) {
        timeStr = s.time;
      } else {
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        timeStr = `${hours}:${mins}`;
      }
    }

    setFormData({
      date: dateStr,
      time: timeStr,
      durationMins: String(s.durationMins ?? ""),
      type: s.type || "yoga",
      maxParticipants: String(s.maxParticipants ?? ""),
      allowedUserTypes: s.allowedUserTypes || [],
    });
    setOpen(true);
  };

  const handleCancelClick = (id) => {
    setCancelingId(id);
    setCancelConfirm("");
  };

  const handleConfirmCancel = async (id) => {
    if (cancelConfirm !== "CANCEL SESSION") {
      setError("Please type 'CANCEL SESSION' to confirm");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`http://localhost:5001/api/gym/${id}/cancel`, {}, roleHeader);
      setSuccessMessage("Gym session cancelled successfully");
      setCancelingId(null);
      setCancelConfirm("");
      setTimeout(() => {
        setSuccessMessage(null);
        fetchSessions();
      }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Cancel failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this gym session? This cannot be undone.")) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/gym/${id}`, roleHeader);
      setSuccessMessage("Session deleted successfully");
      setTimeout(() => {
        setSuccessMessage(null);
        fetchSessions();
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Delete failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id, archive = true) => {
    try {
      if (archive) {
        await axios.patch(`http://localhost:5001/api/events/${id}/archive`, {}, roleHeader);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        if (archive) setShowArchived(true);
        fetchSessions();
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Archive operation failed";
      setError(msg);
      console.error("Error archiving gym session:", err);
    }
  };

  const handleExportRegistrations = async (sessionId, sessionType, sessionDate) => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/registrations/event/${sessionId}`,
        roleHeader
      );
      const registrations = response.data.data || response.data || [];

      if (registrations.length === 0) {
        setError("No registrations found for this gym session");
        return;
      }

      const sessionName = `${sessionType} Session - ${new Date(
        sessionDate
      ).toLocaleDateString()}`;
      exportRegistrationsToExcel(registrations, sessionName, "gym");
      setSuccessMessage("Registrations exported successfully");
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Failed to export registrations. Please try again.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })
      .toUpperCase();
  };

  const formatTime = (session) => {
    if (session.time) return session.time;
    if (session.date) {
      const d = new Date(session.date);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return "-";
  };

  return (
    <>
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .gym-container { animation: slideInDown 0.4s ease-out; }
        .gym-card {
          transition: ${EOtransitions.normal};
          animation: slideInUp 0.3s ease-out;
        }
        .gym-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
        .form-input { transition: ${EOtransitions.normal}; }
        .form-input:hover { border-color: ${EOcolors.pastel}; }
        .form-input:focus {
          border-color: ${EOcolors.primary};
          box-shadow: 0 0 0 4px ${EOcolors.primary}15;
          background-color: ${EOcolors.light};
        }
        .btn-primary {
          transition: ${EOtransitions.normal};
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px ${EOcolors.primary}30;
        }
        .btn-danger-glow:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 24px ${EOcolors.error}60, inset 0 0 24px ${EOcolors.error}20;
        }
        .modal-backdrop { animation: fadeIn 0.3s ease-out; }
        [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="gym-container">
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
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ marginLeft: "auto", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              ...EOalertStyles.success,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <CheckIcon style={{ width: "1.25rem", height: "1.25rem" }} />
            <span>{successMessage}</span>
          </div>
        )}

        <Card
          style={{
            ...EOcardStyles.base,
            border: `2px solid ${EOcolors.lightSilver}`,
          }}
        >
          <CardHeader className="px-0 pb-2 border-b border-border/40">
          <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <CardTitle
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "800",
                    color: EOcolors.secondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  Gym Sessions
                </CardTitle>
                <p
                  style={{
                    color: EOcolors.text.secondary,
                    fontSize: "0.9375rem",
                  }}
                >
                  Create and manage gym sessions for campus fitness activities
                </p>
              </div>

              <Dialog
                open={open}
                onOpenChange={(o) => {
                  setOpen(o);
                  if (!o) {
                    setEditing(null);
                    resetForm();
                  }
                }}
              >
                <button
                  onClick={() => {
                    setEditing(null);
                    resetForm();
                    setOpen(true);
                  }}
                  style={{
                    ...EObuttonStyles.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <PlusIcon style={{ width: "1.125rem", height: "1.125rem" }} />
                  Create Session
                </button>

                <DialogContent
                  style={{
                    ...EOcardStyles.base,
                    maxWidth: "40rem",
                    border: `2px solid ${EOcolors.lightSilver}`,
                  }}
                >
                  <DialogHeader>
                    <DialogTitle
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "800",
                        color: EOcolors.secondary,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "2.5rem",
                          height: "2.5rem",
                          borderRadius: EOradius.lg,
                          background: `linear-gradient(135deg, ${EOcolors.primary}20, ${EOcolors.tertiary}20)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SparklesIcon
                          style={{
                            width: "1.25rem",
                            height: "1.25rem",
                            color: EOcolors.primary,
                          }}
                        />
                      </div>
                      {editing ? "Edit Gym Session" : "Create New Gym Session"}
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                      }}
                    >
                      {/* Date & Time Row */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <label style={EOformStyles.label}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <CalendarIcon style={{ width: "1rem", height: "1rem" }} />
                              Date *
                            </div>
                          </label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) =>
                              setFormData({ ...formData, date: e.target.value })
                            }
                            required
                            className="form-input"
                            style={EOformStyles.base}
                          />
                        </div>
                        <div>
                          <label style={EOformStyles.label}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <ClockIcon style={{ width: "1rem", height: "1rem" }} />
                              Time *
                            </div>
                          </label>
                          <input
                            type="time"
                            value={formData.time}
                            onChange={(e) =>
                              setFormData({ ...formData, time: e.target.value })
                            }
                            required
                            className="form-input"
                            style={EOformStyles.base}
                          />
                        </div>
                      </div>

                      {/* Duration & Type Row */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <label style={EOformStyles.label}>Duration (minutes) *</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.durationMins}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                durationMins: e.target.value,
                              })
                            }
                            required
                            className="form-input"
                            style={EOformStyles.base}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              ...EOformStyles.label,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Type{" "}
                            {editing && (
                              <span
                                style={{
                                  color: EOcolors.text.muted,
                                  fontSize: "0.75rem",
                                }}
                              >
                                🔒
                              </span>
                            )}
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData({ ...formData, type: e.target.value })
                            }
                            disabled={editing}
                            style={{
                              ...EOformStyles.base,
                              cursor: editing ? "not-allowed" : "pointer",
                              opacity: editing ? 0.6 : 1,
                            }}
                          >
                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Max Participants */}
                      <div>
                        <label
                          style={{
                            ...EOformStyles.label,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Max Participants{" "}
                          {editing && (
                            <span
                              style={{
                                color: EOcolors.text.muted,
                                fontSize: "0.75rem",
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxParticipants}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxParticipants: e.target.value,
                            })
                          }
                          required
                          disabled={editing}
                          className="form-input"
                          style={{
                            ...EOformStyles.base,
                            cursor: editing ? "not-allowed" : "pointer",
                            opacity: editing ? 0.6 : 1,
                          }}
                        />
                      </div>

                      {/* User Type Restrictions */}
                      <div>
                        <label
                          style={{
                            ...EOformStyles.label,
                            display: "block",
                            marginBottom: "0.75rem",
                          }}
                        >
                          Restrict to User Types{" "}
                          {editing && (
                            <span
                              style={{
                                color: EOcolors.text.muted,
                                fontSize: "0.875rem",
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1rem",
                            opacity: editing ? 0.5 : 1,
                            pointerEvents: editing ? "none" : "auto",
                          }}
                        >
                          {["Student", "Staff", "TA", "Professor"].map((userType) => (
                            <label
                              key={userType}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                cursor: editing ? "not-allowed" : "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={(formData.allowedUserTypes || []).includes(
                                  userType
                                )}
                                onChange={() => handleUserTypeToggle(userType)}
                                disabled={editing}
                                style={{
                                  width: "1rem",
                                  height: "1rem",
                                  cursor: editing ? "not-allowed" : "pointer",
                                  accentColor: EOcolors.primary,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.9375rem",
                                  color: EOcolors.text.secondary,
                                  fontWeight: "500",
                                }}
                              >
                                {userType}
                              </span>
                            </label>
                          ))}
                        </div>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: editing ? EOcolors.warning : EOcolors.text.muted,
                            marginTop: "0.5rem",
                            fontWeight: editing ? "600" : "400",
                          }}
                        >
                          {editing
                            ? " 🔒 You can only change date, time, and duration when editing."
                            : formData.allowedUserTypes.length === 0
                            ? "Leave empty for all users"
                            : `Only ${formData.allowedUserTypes.join(
                                ", "
                              )} can register`}
                        </p>
                      </div>

                      {/* Error in form (only request-related ones) */}
                      {error && !error.includes("Failed to") && (
                        <div
                          style={{
                            ...EOalertStyles.error,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                          }}
                        >
                          <span>⚠️</span>
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Form Buttons */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "1rem",
                          marginTop: "1.5rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          style={{
                            ...EObuttonStyles.outline,
                            width: "100%",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            ...EObuttonStyles.primary,
                            width: "100%",
                          }}
                        >
                          {editing ? "Save Changes" : "Create Session"}
                        </button>
                      </div>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            {loading ? (
              <TableSkeleton rows={5} columns={8} />
            ) : sessions.length === 0 ? (
              <NoGymSlotsState />
            ) : (
              <>
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowArchived(false);
                      setFilteredSessions([]);
                    }}
                    style={{
                      ...(!showArchived
                        ? EObuttonStyles.primary
                        : EObuttonStyles.outline),
                      padding: "0.75rem 1.25rem",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      borderRadius: EOradius.lg,
                      transition: EOtransitions.normal,
                    }}
                  >
                    Active ({sessions.filter((s) => !s.archived).length})
                  </button>
                  <button
                    onClick={() => {
                      setShowArchived(true);
                      setFilteredSessions([]);
                    }}
                    style={{
                      ...(showArchived
                        ? EObuttonStyles.primary
                        : EObuttonStyles.outline),
                      padding: "0.75rem 1.25rem",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      borderRadius: EOradius.lg,
                      transition: EOtransitions.normal,
                    }}
                  >
                    Archived ({sessions.filter((s) => s.archived).length})
                  </button>
                </div>

                {/* Filter component (kept commented out to avoid loop) */}
                {/*
                {sessions.filter(s => showArchived ? s.archived : !s.archived).length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <EventFilterSort
                      events={sessions.filter(s => showArchived ? s.archived : !s.archived)}
                      onFilteredEventsChange={setFilteredSessions}
                      eventType="gym session"
                    />
                  </div>
                )}
                */}

                {/* Cards Grid */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {(filteredSessions.length > 0
                    ? filteredSessions
                    : sessions.filter((s) =>
                        showArchived ? s.archived : !s.archived
                      )
                  ).map((s) => {
                    const currentDate = new Date();
                    const sessionDate = new Date(s.date);
                    const isPast = sessionDate < currentDate;

                    return (
                      <div
                        key={s._id}
                        className="gym-card"
                        style={{
                          background: "white",
                          borderRadius: EOradius.xl,
                          border: `2px solid ${EOcolors.lightSilver}`,
                          padding: "1.5rem",
                          display: "flex",
                          gap: "1.5rem",
                          alignItems: "flex-start",
                          opacity: s.archived ? 0.7 : 1,
                          boxShadow: EOshadows.sm,
                        }}
                      >
                        {/* Date & Time Box */}
                        <div
                          style={{
                            flexShrink: 0,
                            background: `linear-gradient(135deg, ${EOcolors.light}, ${EOcolors.pastel}20)`,
                            borderRadius: EOradius.lg,
                            padding: "1.25rem",
                            textAlign: "center",
                            minWidth: "110px",
                            border: `2px solid ${EOcolors.lightSilver}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              color: EOcolors.text.muted,
                              letterSpacing: "0.05em",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {formatDate(s.date)}
                          </div>
                          <div
                            style={{
                              fontSize: "2rem",
                              fontWeight: "800",
                              color: EOcolors.secondary,
                              lineHeight: 1,
                            }}
                          >
                            {formatTime(s)}
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              marginBottom: "0.75rem",
                            }}
                          >
                            <div>
                              <h3
                                style={{
                                  fontSize: "1.25rem",
                                  fontWeight: "800",
                                  color: EOcolors.secondary,
                                  margin: 0,
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {TYPE_LABELS[s.type] || s.type}
                                {s.archived && (
                                  <span
                                    style={{
                                      marginLeft: "0.75rem",
                                      fontSize: "0.875rem",
                                      fontWeight: "500",
                                      color: EOcolors.text.muted,
                                    }}
                                  >
                                    (Archived)
                                  </span>
                                )}
                              </h3>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "0.9375rem",
                                  color: EOcolors.text.secondary,
                                }}
                              >
                                {s.durationMins} minutes • Max {s.maxParticipants}{" "}
                                participants
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {s.archived ? (
                                <span
                                  style={{
                                    ...EObadgeStyles.error,
                                    display: "inline-block",
                                  }}
                                >
                                  Archived
                                </span>
                              ) : s.status === "cancelled" ? (
                                <span
                                  style={{
                                    ...EObadgeStyles.error,
                                    display: "inline-block",
                                  }}
                                >
                                  Cancelled
                                </span>
                              ) : isPast ? (
                                <span
                                  style={{
                                    ...EObadgeStyles.pending,
                                    display: "inline-block",
                                  }}
                                >
                                  Past Event
                                </span>
                              ) : (
                                <span
                                  style={{
                                    ...EObadgeStyles.success,
                                    display: "inline-block",
                                  }}
                                >
                                  Upcoming
                                </span>
                              )}
                            </div>
                          </div>

                          {/* User Type Restrictions */}
                          {s.allowedUserTypes && s.allowedUserTypes.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.5rem",
                                marginBottom: "1rem",
                              }}
                            >
                              {s.allowedUserTypes.map((type) => (
                                <span
                                  key={type}
                                  style={{
                                    ...EObadgeStyles.info,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                              marginTop: "1rem",
                            }}
                          >
                            {!s.archived &&
                              s.status !== "cancelled" &&
                              s.status !== "completed" && (
                                <button
                                  onClick={() => handleEdit(s)}
                                  style={{
                                    ...EObuttonStyles.outline,
                                    padding: "0.5rem 1rem",
                                    fontSize: "0.875rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <PencilIcon
                                    style={{ width: "1rem", height: "1rem" }}
                                  />
                                  Edit
                                </button>
                              )}

                            {!s.archived && isPast && (
                              <button
                                onClick={() => handleArchive(s._id, true)}
                                style={{
                                  ...EObuttonStyles.outline,
                                  padding: "0.5rem 1rem",
                                  fontSize: "0.875rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  borderColor: EOcolors.primary,
                                  color: EOcolors.primary,
                                }}
                              >
                                <ArchiveBoxIcon
                                  style={{ width: "1rem", height: "1rem" }}
                                />
                                Archive
                              </button>
                            )}

                            <button
                              onClick={() =>
                                handleExportRegistrations(
                                  s._id,
                                  TYPE_LABELS[s.type] || s.type,
                                  s.date
                                )
                              }
                              style={{
                                ...EObuttonStyles.outline,
                                padding: "0.5rem 1rem",
                                fontSize: "0.875rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                borderColor: "#3B82F6",
                                color: "#3B82F6",
                              }}
                            >
                              <ArrowDownTrayIcon
                                style={{ width: "1rem", height: "1rem" }}
                              />
                              Export
                            </button>

                            {!s.archived &&
                              !isPast &&
                              s.status !== "cancelled" && (
                                <button
                                  onClick={() => handleCancelClick(s._id)}
                                  style={{
                                    ...EObuttonStyles.outline,
                                    padding: "0.5rem 1rem",
                                    fontSize: "0.875rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    borderColor: EOcolors.error,
                                    color: EOcolors.error,
                                  }}
                                >
                                  <ExclamationTriangleIcon
                                    style={{ width: "1rem", height: "1rem" }}
                                  />
                                  Cancel
                                </button>
                              )}

                            <button
                              onClick={() => handleDelete(s._id)}
                              style={{
                                ...EObuttonStyles.outline,
                                padding: "0.5rem 1rem",
                                fontSize: "0.875rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                borderColor: EOcolors.error,
                                color: EOcolors.error,
                                marginLeft: "auto",
                              }}
                            >
                              <TrashIcon
                                style={{ width: "1rem", height: "1rem" }}
                              />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cancel Session Modal */}
        {cancelingId && (
          <div
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
          >
            <div
              className="modal-backdrop"
              style={{
                ...EOcardStyles.base,
                maxWidth: "36rem",
                width: "90%",
                border: `2px solid ${EOcolors.error}`,
              }}
            >
              <div style={{ marginBottom: "2rem" }}>
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: EOradius.xl,
                    background: `${EOcolors.error}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <ExclamationTriangleIcon
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      color: EOcolors.error,
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "800",
                    color: EOcolors.secondary,
                    margin: 0,
                  }}
                >
                  Cancel Gym Session?
                </h3>
                <p
                  style={{
                    color: EOcolors.text.secondary,
                    marginTop: "0.5rem",
                  }}
                >
                  This action cannot be undone. All participants will be notified.
                </p>
              </div>

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
                    fontWeight: "500",
                  }}
                >
                  ⚠️ <strong>Impact:</strong> All registered participants will
                  receive a cancellation notification. Payments will be refunded
                  automatically.
                </p>
              </div>

              {/* Confirmation Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={EOformStyles.label}>
                  Type to confirm: CANCEL SESSION
                </label>
                <input
                  type="text"
                  value={cancelConfirm}
                  onChange={(e) => {
                    setCancelConfirm(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Type: CANCEL SESSION"
                  style={{
                    ...EOformStyles.base,
                    marginTop: "0.5rem",
                    border: `2px solid ${EOcolors.citron}`,
                    fontFamily: "monospace",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                  }}
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    setCancelingId(null);
                    setCancelConfirm("");
                    setError(null);
                  }}
                  style={{
                    ...EObuttonStyles.outline,
                    width: "100%",
                  }}
                >
                  Keep Session
                </button>
                <button
                  onClick={() => handleConfirmCancel(cancelingId)}
                  disabled={cancelConfirm !== "CANCEL SESSION" || loading}
                  className="btn-danger-glow"
                  style={{
                    ...EObuttonStyles.danger,
                    width: "100%",
                    opacity:
                      cancelConfirm !== "CANCEL SESSION" || loading ? 0.5 : 1,
                    cursor:
                      cancelConfirm !== "CANCEL SESSION" || loading
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  {loading ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon
                        style={{ width: "1.125rem", height: "1.125rem" }}
                      />
                      Cancel Session
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
