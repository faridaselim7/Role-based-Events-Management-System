import { useState } from "react";
import { Upload, Plus, X, ChevronDown,Tag } from "lucide-react";

export default function ApplyForm({ bazaar, vendorId, onSubmit }) {
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const [attendees, setAttendees] = useState([
    { name: "", email: "", idFile: null },
  ]);
  const [boothSize, setBoothSize] = useState("2x2");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]); // <-- array now

const [selectedCategories, setSelectedCategories] = useState([]); // ["Food", "Tech", ...]
  const [tagInput, setTagInput] = useState("");



  // Color Palette
  const colors = {
    primary: "#307B8E",
    secondary: "#A9D3C5",
    tertiary: "#CEE5D6",
    accent: "#103A57",
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    light: "#F8FAFB",
    border: "#E5E7EB",
  };

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const handleAttendeeChange = (index, field, value) => {
    const newAtt = [...attendees];
    newAtt[index][field] = value;
    setAttendees(newAtt);
  };

  const handleIdFile = (index, file) => {
    const newAtt = [...attendees];
    newAtt[index].idFile = file;
    setAttendees(newAtt);
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
  setSubmitting(true);

  // Validate
  for (const attendee of attendees) {
    if (!attendee.name.trim()) {
      setError("All attendees must have a name.");
      setSubmitting(false);
      return;
    }
    if (!attendee.email.trim()) {
      setError("All attendees must have an email.");
      setSubmitting(false);
      return;
    }
    if (!attendee.idFile) {
      setError("Each attendee must upload an ID document.");
      setSubmitting(false);
      return;
    }
  }

  // Get vendor info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const vendorEmail = user?.email || vendorId;

  console.log('📋 Submitting with vendor email:', vendorEmail);

  // ✅ CREATE FormData FIRST
  const formData = new FormData();
  formData.append("vendorId", vendorEmail);
  formData.append("bazaarId", bazaar._id);
  formData.append("boothSize", boothSize);
   formData.append("categories", JSON.stringify(selectedCategories));
  formData.append("tags", JSON.stringify(tags));

  // Add attendees as JSON array
  formData.append("attendees", JSON.stringify(
    attendees.map(a => ({
      name: a.name,
      email: a.email
    }))
  ));

  // ✅ THEN append ID files - use 'idFile' as the field name (not 'idFile_0', 'idFile_1')
  attendees.forEach((attendee) => {
    if (attendee.idFile) {
      formData.append("idFile", attendee.idFile);
    }
  });

  try {
    const res = await fetch(
      "http://localhost:5001/api/vendors/apply-for-bazaar",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Application failed");

    

    console.log("✅ Application successful!");
    onSubmit();
  } catch (err) {
    console.error("❌ Error:", err);
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};

  // ------------------------------------------------------------------
  // Render
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

        .apply-form-container {
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

        .attendee-card {
          animation: slideIn 0.3s ease-out;
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

        .error-banner {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <form
        className="apply-form-container"
        onSubmit={handleSubmit}
        style={{
          padding: "2.5rem",
          maxWidth: "65rem",
          margin: "0 auto",
          background: "white",
          borderRadius: "1.25rem",
          boxShadow: "0 10px 40px rgba(16, 58, 87, 0.1)",
          border: `2px solid ${colors.tertiary}`,
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
            Apply for Bazaar
          </h3>
          <p
            style={{
              fontSize: "1.0625rem",
              fontWeight: "600",
              color: colors.primary,
              marginBottom: "0.5rem",
            }}
          >
            {bazaar.name}
          </p>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#6B7280",
              maxWidth: "32rem",
              margin: "0 auto",
            }}
          >
            {bazaar.description}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            className="error-banner"
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

        {/* Booth Size Section */}
        <div style={{ marginBottom: "2.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.9375rem",
              fontWeight: "700",
              color: colors.accent,
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Booth Size <span style={{ color: colors.error }}>*</span>
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              gap: "1rem",
            }}
          >
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
      {/* Categories & Tags Section */}
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
        Categories
      </label>
    </div>

    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      {["Food", "Drinks", "Clothing", "Accessories", "Tech", "Games", "Services", "Other"].map(
        (cat) => {
          const isActive = categories.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() =>
                isActive
                  ? setCategories(categories.filter((c) => c !== cat))
                  : setCategories([...categories, cat])
              }
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: `2px solid ${isActive ? colors.primary : colors.tertiary}`,
                background: isActive ? colors.tertiary : "white",
                color: isActive ? colors.accent : colors.primary,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {cat}
            </button>
          );
        }
      )}
    </div>
    <p style={{ fontSize: "0.8rem", marginTop: "0.4rem", color: "#6B7280" }}>
      Click to select multiple categories
    </p>
  </div>

  {/* TAGS (same behavior as second version) */}
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
      placeholder="e.g. bubble tea, handmade, skincare..."
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

    {/* Tag Pills */}
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
              onClick={() => setTags(tags.filter((t) => t !== tag))}
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
      {["desserts","coffee","street food","handmade","vintage","sustainable","gaming","giveaways","skincare","books"].map(
        (t) => (
          <button
            key={t}
            type="button"
            onClick={() => !tags.includes(t) && setTags([...tags, t])}
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
        )
      )}
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

                {/* ID Upload */}
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
          disabled={submitting}
          className="btn-submit"
          style={{
            width: "100%",
            padding: "1.125rem 2rem",
            borderRadius: "0.875rem",
            fontWeight: "700",
            fontSize: "1.0625rem",
            color: "white",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: submitting ? "not-allowed" : "pointer",
            border: "none",
            background: colors.primary,
            boxShadow: `0 4px 12px ${colors.primary}30`,
            opacity: submitting ? 0.6 : 1,
            letterSpacing: "0.02em",
          }}
        >
          {submitting ? (
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
            "Submit Application"
          )}
        </button>
      </form>
    </>
  );
}