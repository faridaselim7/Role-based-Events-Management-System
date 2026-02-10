import { useState } from "react";
import { Upload, Plus, X, MapPin, Clock, Layout, Tag} from "lucide-react";

export default function BoothApplicationForm({ bazaarApplication, vendorId, onSubmit }) {
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------

const [attendees, setAttendees] = useState([
  { name: "", email: "", idFile: null },
]);
  
  const [setupDuration, setSetupDuration] = useState("1 week");
  const [location, setLocation] = useState("");
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

    // NEW: recommendation-related state
  const [selectedCategories, setSelectedCategories] = useState([]); // ["Food", "Tech", ...]
  const [tags, setTags] = useState([]); // ["desserts", "bubble tea", ...]
  const [tagInput, setTagInput] = useState("");


  // Color Palette
  const colors = {
    primary: "#307B8E",      // Teal Blue
    secondary: "#A9D3C5",    // Light Teal
    tertiary: "#CEE5D6",     // Soft Mint
    accent: "#103A57",       // Deep Prussian
    success: "#10B981",      // Emerald
    error: "#EF4444",        // Red
    warning: "#F59E0B",      // Amber
    light: "#F8FAFB",        // Nearly White
    border: "#E5E7EB",       // Light Gray
  };

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const handleAttendeeChange = (index, field, value) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
  };

  const addAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: "", email: "", idFile: null }]);
    }
  };

  const removeAttendee = (index) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const handleIdFile = (index, file) => {
    const newAttendees = [...attendees];
    newAttendees[index].idFile = file;
    setAttendees(newAttendees);
  };

     // --- NEW: category + tags handlers --------------------------------
  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const raw = tagInput.trim();
      if (!raw) return;

      const normalized = raw.toLowerCase();
      if (!tags.includes(normalized)) {
        setTags((prev) => [...prev, normalized]);
      }
      setTagInput("");
    }
  };

  const addTagFromSuggestion = (t) => {
    const normalized = t.toLowerCase();
    if (!tags.includes(normalized)) {
      setTags((prev) => [...prev, normalized]);
    }
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };


  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------
  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess(false);
  setLoading(true);

  if (!location.trim()) {
    setError("Location is required");
    setLoading(false);
    return;
  }

    if (selectedCategories.length === 0) {
    setError("Please choose at least one category that describes your booth.");
    setLoading(false);
    return;
  }


  for (const attendee of attendees) {
    if (!attendee.name.trim() || !attendee.email.trim()) {
      setError("All attendees must have both name and email");
      setLoading(false);
      return;
    }
    if (!attendee.idFile) {
      setError("Each attendee must upload an ID document");
      setLoading(false);
      return;
    }
  }

  //const user = JSON.parse(localStorage.getItem('user') || '{}');
  //const vendorEmail = user?.email || vendorId;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
const vendorIdToSend = user?._id || user?.id;

if (!vendorIdToSend) {
  setError("You must be logged in to apply.");
  setLoading(false);
  return;
}
const formData = new FormData();

formData.append("vendorId", vendorIdToSend);  // ← NOW SENDS REAL OBJECTID
// Optional: still send email for debugging
formData.append("vendorEmail", user.email || "");

  // ✅ CREATE FormData FIRST
  //formData.append("vendorId", vendorEmail);
  formData.append("setupDuration", setupDuration);
  formData.append("location", location);
  formData.append("boothSize", boothSize);

    // NEW: categories + tags (as JSON strings, backend will JSON.parse)
  formData.append("categories", JSON.stringify(selectedCategories));
  formData.append("tags", JSON.stringify(tags));


  // Add attendees as JSON array
  const attendeesData = attendees.map(a => ({
    name: a.name,
    email: a.email
  }));
  formData.append("attendees", JSON.stringify(attendeesData));

  // ✅ THEN append ID files - use 'idFile' as the field name
  attendees.forEach((attendee) => {
    if (attendee.idFile) {
      formData.append("idFile", attendee.idFile);
    }
  });

  try {
    const res = await fetch("http://localhost:5001/api/vendors/apply-for-booth", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to submit booth application");
    }

    setSuccess(true);
    setAttendees([{ name: "", email: "", idFile: null }]);
    setSetupDuration("1 week");
    setLocation("");
    setBoothSize("2x2");

    setSelectedCategories([]);
    setTags([]);
    setTagInput("");


    if (onSubmit) onSubmit(data);

    setTimeout(() => setSuccess(false), 3000);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // ------------------------------------------------------------------
  // Render - Modern Design System
  // ------------------------------------------------------------------
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .booth-form-container {
          animation: slideIn 0.4s ease-out;
        }

        .form-input, .form-select {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input:hover:not(:disabled), .form-select:hover:not(:disabled) {
          border-color: ${colors.secondary};
        }

        .form-input:focus, .form-select:focus {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 4px ${colors.primary}15;
          background-color: ${colors.light};
        }

        .section-card {
          animation: slideIn 0.3s ease-out;
        }

        .attendee-card {
          animation: slideIn 0.35s ease-out;
        }

        .info-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: ${colors.tertiary};
          border: 2px solid ${colors.secondary};
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${colors.accent};
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px ${colors.secondary}40;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px ${colors.primary}35;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-banner {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

<form
  onSubmit={handleSubmit}
  style={{
    padding: "0rem",
    maxWidth: "65rem",
    margin: "0 auto",
  }}
>
        {/* Header Section */}
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <h3
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              color: colors.accent,
              letterSpacing: "-0.02em",
            }}
          >
            Apply for Platform Booth
          </h3>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#6B7280",
              maxWidth: "32rem",
              margin: "0 auto",
            }}
          >
            Set up your booth on the GUC platform with flexible duration and location options
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="alert-banner"
            style={{
              color: "#065F46",
              background: "#ECFDF5",
              border: `2px solid ${colors.success}`,
              borderRadius: "0.875rem",
              padding: "1rem 1.25rem",
              marginBottom: "2rem",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "0.9375rem",
              boxShadow: `0 4px 12px ${colors.success}20`,
            }}
          >
            ✓ Booth application submitted successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="alert-banner"
            style={{
              color: "#7F1D1D",
              background: "#FEE2E2",
              border: `2px solid ${colors.error}`,
              borderRadius: "0.875rem",
              padding: "1rem 1.25rem",
              marginBottom: "2rem",
              textAlign: "center",
              fontWeight: "600",
              fontSize: "0.9375rem",
              boxShadow: `0 4px 12px ${colors.error}20`,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Location Section */}
        <div
          className="section-card"
          style={{
            marginBottom: "2.5rem",
            padding: "1.5rem",
            background: colors.light,
            border: `2px solid ${colors.tertiary}`,
            borderRadius: "1rem",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.tertiary;
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
            <label
              style={{
                fontSize: "0.9375rem",
                fontWeight: "700",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Booth Location <span style={{ color: colors.error }}>*</span>
            </label>
          </div>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Near entrance, Corner spot, Zone A"
            required
            className="form-input"
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              border: `2px solid ${colors.tertiary}`,
              borderRadius: "0.75rem",
              fontSize: "0.9375rem",
              color: colors.accent,
              background: "white",
              outline: "none",
            }}
          />
        </div>

                {/* Booth Size Section */}
                <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <Layout className="w-5 h-5" style={{ color: colors.primary }} />
            <label
              style={{
                fontSize: "0.9375rem",
                fontWeight: "700",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Booth Size <span style={{ color: colors.error }}>*</span>
            </label>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            {["2x2", "4x4"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBoothSize(size)}
                style={{
                  flex: 1,
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  fontSize: "1rem",
                  fontWeight: "600",
                  border: `2px solid ${boothSize === size ? colors.primary : colors.tertiary}`,
                  background: boothSize === size ? colors.tertiary : "white",
                  color: boothSize === size ? colors.accent : colors.primary,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: boothSize === size ? `0 4px 12px ${colors.primary}20` : "none",
                }}
                onMouseEnter={(e) => {
                  if (boothSize !== size) {
                    e.target.style.borderColor = colors.secondary;
                    e.target.style.background = "#F3F9F7";
                  }
                }}
                onMouseLeave={(e) => {
                  if (boothSize !== size) {
                    e.target.style.borderColor = colors.tertiary;
                    e.target.style.background = "white";
                  }
                }}
              >
                {size} meters
              </button>
            ))}
          </div>
        </div>

        {/* Duration Section */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <Clock className="w-5 h-5" style={{ color: colors.primary }} />
            <label
              style={{
                fontSize: "0.9375rem",
                fontWeight: "700",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Duration <span style={{ color: colors.error }}>*</span>
            </label>
          </div>
          <select
            value={setupDuration}
            onChange={(e) => setSetupDuration(e.target.value)}
            className="form-select"
            required
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              border: `2px solid ${colors.tertiary}`,
              borderRadius: "0.75rem",
              fontSize: "0.9375rem",
              color: colors.accent,
              background: "white",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="1 week">1 week</option>
            <option value="2 weeks">2 weeks</option>
            <option value="3 weeks">3 weeks</option>
            <option value="4 weeks">4 weeks</option>
          </select>
        </div>

       {/* NEW: Categories & Tags for recommendations */}
        <div style={{ marginBottom: "2.5rem" }}>
          {/* Categories */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <Tag className="w-5 h-5" style={{ color: colors.primary }} />
              <label
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: "700",
                  color: colors.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Booth Categories <span style={{ color: colors.error }}>*</span>
              </label>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {["Food","Drinks","Clothing","Accessories","Tech","Games","Services","Other"].map((cat) => {
                const isActive = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "999px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      border: `2px solid ${
                        isActive ? colors.primary : colors.tertiary
                      }`,
                      background: isActive ? colors.tertiary : "white",
                      color: isActive ? colors.accent : colors.primary,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "600",
                color: colors.accent,
                marginBottom: "0.5rem",
              }}
            >
              Tags (optional)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="e.g. bubble tea, sushi, handmade, skincare..."
              className="form-input"
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                border: `2px solid ${colors.tertiary}`,
                borderRadius: "0.75rem",
                fontSize: "0.9rem",
                color: colors.accent,
                background: "white",
                outline: "none",
                marginBottom: "0.75rem",
              }}
            />

            {/* Current tags */}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "999px",
                      background: colors.tertiary,
                      color: colors.accent,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div style={{ fontSize: "0.8rem", color: "#6B7280", marginBottom: "0.35rem" }}>
              Suggestions (click to add):
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["desserts","coffee","street food","handmade","vintage","sustainable","gaming","giveaways","skincare","books"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTagFromSuggestion(t)}
                  style={{
                    padding: "0.3rem 0.7rem",
                    borderRadius: "999px",
                    border: `1px dashed ${colors.tertiary}`,
                    background: colors.light,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Attendees Section */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <label
              style={{
                fontSize: "0.9375rem",
                fontWeight: "700",
                color: colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Attendees <span style={{ color: colors.error }}>*</span>
              <span style={{ fontWeight: "400", color: colors.primary, marginLeft: "0.5rem" }}>
                (Max 5)
              </span>
            </label>
            {attendees.length < 5 && (
              <button
                type="button"
                onClick={addAttendee}
                className="btn-add"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  padding: "0.625rem 1.25rem",
                  background: colors.tertiary,
                  color: colors.accent,
                  fontWeight: "700",
                  border: `2px solid ${colors.secondary}`,
                  borderRadius: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <Plus className="w-4 h-4" />
                Add Attendee
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {attendees.map((attendee, idx) => (
              <div
                key={idx}
                className="attendee-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                  alignItems: "end",
                  padding: "1.5rem",
                  background: colors.light,
                  border: `2px solid ${colors.tertiary}`,
                  borderRadius: "1rem",
                  position: "relative",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.secondary;
                  e.currentTarget.style.background = "#F9FDFB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.tertiary;
                  e.currentTarget.style.background = colors.light;
                }}
              >
                {/* Name */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: "700",
                      color: colors.accent,
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={attendee.name}
                    onChange={(e) =>
                      handleAttendeeChange(idx, "name", e.target.value)
                    }
                    placeholder="Full name"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      border: `2px solid ${colors.tertiary}`,
                      borderRadius: "0.75rem",
                      fontSize: "0.9375rem",
                      color: colors.accent,
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: "700",
                      color: colors.accent,
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={attendee.email}
                    onChange={(e) =>
                      handleAttendeeChange(idx, "email", e.target.value)
                    }
                    placeholder="email@example.com"
                    className="form-input"
                    style={{
                      width: "100%",
                      padding: "0.875rem 1rem",
                      border: `2px solid ${colors.tertiary}`,
                      borderRadius: "0.75rem",
                      fontSize: "0.9375rem",
                      color: colors.accent,
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>

               
                <div style={{ position: "relative" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8125rem",
                      fontWeight: "700",
                      color: colors.accent,
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    ID Document
                  </label>
                  <label style={{ display: "block", cursor: "pointer" }}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        e.target.files?.[0] && handleIdFile(idx, e.target.files[0])
                      }
                      style={{ display: "none" }}
                      required
                    />
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.875rem 1rem",
                        borderRadius: "0.75rem",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        width: "100%",
                        background: attendee.idFile ? colors.tertiary : colors.primary,
                        color: attendee.idFile ? colors.accent : "white",
                        border: "2px solid transparent",
                        boxShadow: attendee.idFile
                          ? `0 4px 12px ${colors.secondary}30`
                          : `0 4px 12px ${colors.primary}30`,
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = `0 6px 16px ${colors.secondary}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = attendee.idFile
                          ? `0 4px 12px ${colors.secondary}30`
                          : `0 4px 12px ${colors.primary}30`;
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      {attendee.idFile
                        ? attendee.idFile.name.length > 18
                          ? attendee.idFile.name.slice(0, 15) + "..."
                          : attendee.idFile.name
                        : "Upload ID"}
                    </span>
                  </label>
                </div>

                {/* Remove Button */}
                {attendees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAttendee(idx)}
                    title="Remove attendee"
                    style={{
                      position: "absolute",
                      right: "-0.75rem",
                      top: "-0.75rem",
                      color: colors.error,
                      background: "white",
                      border: `2px solid ${colors.error}`,
                      borderRadius: "0.5rem",
                      padding: "0.375rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      boxShadow: `0 2px 8px ${colors.error}20`,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#FEE2E2";
                      e.target.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "white";
                      e.target.style.transform = "scale(1)";
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
          style={{
            width: "100%",
            padding: "1.125rem 2rem",
            borderRadius: "0.875rem",
            fontWeight: "700",
            fontSize: "1.0625rem",
            color: "white",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            background: colors.primary,
            boxShadow: `0 4px 12px ${colors.primary}30`,
            opacity: loading ? 0.6 : 1,
            letterSpacing: "0.02em",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
              <div
                style={{
                  animation: "spin 1s linear infinite",
                  borderRadius: "50%",
                  height: "1.25rem",
                  width: "1.25rem",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                }}
              ></div>
              Submitting Application...
            </span>
          ) : (
            "Submit Booth Application"
          )}
        </button>
      </form>
    </>
  );
}