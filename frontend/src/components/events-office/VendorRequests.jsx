// frontend/src/components/events-office/VendorRequests.jsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Menu } from "@headlessui/react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";


// ✅ use your API wrapper in frontend/src/pages/vendorRequests.js
import {
  listVendorRequests,
  getVendorRequest,
  updateVendorRequestStatus,
} from "../../pages/vendorRequests";

// EO design system imports
import {
  EOcolors,
  EOshadows,
  EObuttonStyles,
  EOcardStyles,
  EObadgeStyles,
  EOradius,
  EOtransitions,
  EOalertStyles,
} from "../../styles/EOdesignSystem";

// 🔹 Helper: get a nice vendor name instead of ID
function getVendorDisplayName(r) {
  if (!r) return "-";

  // direct field from backend (list / details)
  if (r.vendorName) return r.vendorName;

  // populated vendor object
  if (r.vendor && typeof r.vendor === "object") {
    if (r.vendor.companyName) return r.vendor.companyName;
    if (r.vendor.name) return r.vendor.name;
    if (r.vendor.fullName) return r.vendor.fullName;
    if (r.vendor.email) return r.vendor.email;
  }

  // sometimes backend may put populated object in vendorId
  if (r.vendorId && typeof r.vendorId === "object") {
    if (r.vendorId.companyName) return r.vendorId.companyName;
    if (r.vendorId.name) return r.vendorId.name;
    if (r.vendorId.fullName) return r.vendorId.fullName;
    if (r.vendorId.email) return r.vendorId.email;
  }

  // fallback to raw ID if nothing else
  if (typeof r.vendorId === "string") return r.vendorId;

  return "-";
}

// 🔹 Helper: get a nice event title instead of event ID
function getEventDisplayName(r) {
  if (!r) return "-";

  // direct field from backend (list / details)
  if (r.eventName) return r.eventName;
  if (r.eventTitle) return r.eventTitle;

  // populated event object
  if (r.event && typeof r.event === "object") {
    if (r.event.title) return r.event.title;
    if (r.event.name) return r.event.name;
  }

  // sometimes backend may put populated object in eventId
  if (r.eventId && typeof r.eventId === "object") {
    if (r.eventId.title) return r.eventId.title;
    if (r.eventId.name) return r.eventId.name;
  }

  // fallback to raw ID if nothing else
  if (typeof r.eventId === "string") return r.eventId;

  return "-";
}

export default function VendorRequests() {
  // "type" matches backend: "", "bazaar", "booth"
  const [type, setType] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // if you want to scope to a vendor, FE can set this, otherwise leave null/undefined
  const vendorId = localStorage.getItem("vendorId") || undefined;

  // Load table (now cards, same logic)
  const fetchRequests = async () => {
    setLoading(true);
    setErr("");
    try {
      // map FE filter to backend query: type + vendorId
      const res = await listVendorRequests({
        type: type || undefined,
        vendorId: vendorId || undefined,
        sort: "desc",
        page: 1,
        limit: 50,
      });
      // unified controller returns { page, limit, count, data: [...] }
      setRequests(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Failed to load requests"
      );
      console.error("Vendor requests error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleTypeChange = (next) => setType(next);

  const handleView = async (r) => {
    try {
      setLoading(true);
      setErr("");
      const full = await getVendorRequest(r._id);
      setSelected(full); // controller returns a plain object for a single item
      setOpen(true);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e.message ||
          "Failed to load request details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      setErr("");
      await updateVendorRequestStatus(id, newStatus);
      await fetchRequests(); // refresh after update
      // also refresh dialog copy
      if (selected?._id === id) {
        const fresh = await getVendorRequest(id);
        setSelected(fresh);
      }
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e.message ||
          "Failed to update request status"
      );
      console.error("Status update error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Helpers for dialog display from unified payload shape
  const readAttendees = (r) =>
    Array.isArray(r?.attendees) ? r.attendees.slice(0, 5) : [];

  const readEvent = (r) => {
    const created = r?.createdAt
      ? new Date(r.createdAt).toLocaleString()
      : "-";
    return {
      // use display name instead of raw ID
      title: getEventDisplayName(r),
      eventCategory: r?.type || "-",
      date: created,
    };
  };

  const readBooth = (r) => ({
    size: r?.boothSize ?? "-",
    setupLocation: r?.location ?? "-",
    setupDuration: r?.setupDuration ?? "-",
  });

  const formatCreatedDate = (dateStr) => {
    if (!dateStr) return { day: "-", month: "" };
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    return { day, month };
  };

  return (
    <>
      <style>{`
        @keyframes vendorRequestsSlideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vendorRequestsSlideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vendor-requests-container {
          animation: vendorRequestsSlideInDown 0.4s ease-out;
        }
        .vendor-card {
          transition: ${EOtransitions.normal};
          animation: vendorRequestsSlideInUp 0.3s ease-out;
        }
        .vendor-card:hover {
          transform: translateY(-4px);
          box-shadow: ${EOshadows.lg};
        }
          [data-radix-card-header] {
          padding-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="vendor-requests-container">
        {/* Top-level error banner (same style as Gym alerts) */}
        {err && (
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
            <span>{err}</span>
            <button
              onClick={() => setErr("")}
              style={{ marginLeft: "auto", cursor: "pointer" }}
            >
              ✕
            </button>
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
              {/* Title + subtitle (Gym style) */}
              <div>
                <CardTitle
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: "800",
                    color: EOcolors.secondary,
                    marginBottom: "0.5rem",
                  }}
                >
                  Vendor Requests
                </CardTitle>
                <p
                  style={{
                    color: EOcolors.text.secondary,
                    fontSize: "0.9375rem",
                    margin: 0,
                  }}
                >
                  Review and manage vendor participation requests for your events.
                </p>
              </div>

              {/* Filters + actions on the right */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Label
                    className="text-sm"
                    style={{ color: EOcolors.text.secondary }}
                  >
                    Type
                  </Label>
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button
                      style={{
                        ...EObuttonStyles.outline,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.9rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <FunnelIcon
                        className="h-5 w-5"
                        style={{ color: EOcolors.text.muted }}
                      />
                      {type
                        ? type.charAt(0).toUpperCase() + type.slice(1)
                        : "All"}
                    </Menu.Button>

                    <Menu.Items
                      style={{
                        background: "white",
                        borderRadius: EOradius.md,
                        boxShadow: EOshadows.lg,
                        border: `1px solid ${EOcolors.lightSilver}`,
                      }}
                      className="absolute right-0 mt-2 w-40 origin-top-right focus:outline-none z-50"
                    >
                      {["", "bazaar", "booth"].map((option) => (
                        <Menu.Item key={option || "all"}>
                          {({ active }) => (
                            <button
                              onClick={() => handleTypeChange(option)}
                              style={{
                                background: active
                                  ? EOcolors.light
                                  : "transparent",
                                color: EOcolors.text.primary,
                              }}
                              className="block w-full text-left px-4 py-2 text-sm first:rounded-t-md last:rounded-b-md"
                            >
                              {option
                                ? option.charAt(0).toUpperCase() +
                                  option.slice(1)
                                : "All"}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Menu>
                </div>

                <button
                  onClick={fetchRequests}
                  style={{
                    ...EObuttonStyles.outline,
                    padding: "0.5rem 1.1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0 pt-4">
            {loading ? (
              <div
                className="p-6 text-sm"
                style={{ color: EOcolors.text.muted }}
              >
                Loading vendor requests…
              </div>
            ) : requests.length === 0 ? (
              <div
                className="p-6 text-sm"
                style={{ color: EOcolors.text.muted }}
              >
                No vendor requests found.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {requests.map((r) => {
                  const { day, month } = formatCreatedDate(r.createdAt);
                  const vendorName = getVendorDisplayName(r);
                  const eventName = getEventDisplayName(r);
                  const boothSize = r.boothSize || "-";
                  const setupInfo =
                    r.type === "booth"
                      ? `${r.setupDuration || "-"} / ${r.location || "-"}`
                      : "-";
                  const status = r.status || "-";

                  return (
                    <div
                      key={r._id}
                      className="vendor-card"
                      style={{
                        background: "white",
                        borderRadius: EOradius.xl,
                        border: `2px solid ${EOcolors.lightSilver}`,
                        padding: "1.5rem",
                        display: "flex",
                        gap: "1.5rem",
                        alignItems: "flex-start",
                        boxShadow: EOshadows.sm,
                      }}
                    >
                      {/* Left date/type box (Gym-style) */}
                      <div
                        style={{
                          flexShrink: 0,
                          background: `linear-gradient(135deg, ${EOcolors.light}, ${EOcolors.pastel}20)`,
                          borderRadius: EOradius.lg,
                          padding: "1.1rem",
                          textAlign: "center",
                          minWidth: "110px",
                          border: `2px solid ${EOcolors.lightSilver}`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            color: EOcolors.text.muted,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {month || "REQ"}
                        </div>
                        <div
                          style={{
                            fontSize: "1.9rem",
                            fontWeight: "800",
                            color: EOcolors.secondary,
                            lineHeight: 1,
                          }}
                        >
                          {day}
                        </div>
                        <div
                          style={{
                            marginTop: "0.35rem",
                            fontSize: "0.78rem",
                            fontWeight: "600",
                            color: EOcolors.text.secondary,
                            textTransform: "capitalize",
                          }}
                        >
                          {r.type || "Request"}
                        </div>
                      </div>

                      {/* Right content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Header row: title + status badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "1rem",
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
                              {vendorName}
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.9375rem",
                                color: EOcolors.text.secondary,
                              }}
                            >
                              Event:{" "}
                              <span style={{ fontWeight: 600 }}>
                                {eventName}
                              </span>{" "}
                              • Booth size {boothSize}
                            </p>
                            <p
                              style={{
                                margin: "0.25rem 0 0",
                                fontSize: "0.875rem",
                                color: EOcolors.text.muted,
                              }}
                            >
                              Setup / Location: {setupInfo}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div>
                            <span
                              style={{
                                ...(status === "Accepted"
                                  ? EObadgeStyles.success
                                  : status === "Rejected"
                                  ? EObadgeStyles.error
                                  : EObadgeStyles.pending),
                                display: "inline-block",
                                fontSize: "0.75rem",
                              }}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* Chips row (type + maybe category info) */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginTop: "0.85rem",
                          }}
                        >
                          {r.type && (
                            <span
                              style={{
                                ...EObadgeStyles.info,
                                fontSize: "0.75rem",
                                textTransform: "capitalize",
                              }}
                            >
                              {r.type}
                            </span>
                          )}
                          {eventName && eventName !== "-" && (
                            <span
                              style={{
                                ...EObadgeStyles.info,
                                fontSize: "0.75rem",
                              }}
                            >
                              Event: {eventName}
                            </span>
                          )}
                          {boothSize && boothSize !== "-" && (
                            <span
                              style={{
                                ...EObadgeStyles.info,
                                fontSize: "0.75rem",
                              }}
                            >
                              Booth: {boothSize}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            marginTop: "1rem",
                          }}
                        >
                          <button
                            style={{
                              ...EObuttonStyles.outline,
                              padding: "0.45rem 1rem",
                              fontSize: "0.875rem",
                            }}
                            onClick={() => handleView(r)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Request Details – Gym-style modal */}
{open && (
  <>
    <style>{`
      @keyframes vendorModalSlideIn {
        from {
          opacity: 0;
          transform: scale(0.96) translateY(-16px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      @keyframes vendorBackdropFadeIn {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to { opacity: 1; backdrop-filter: blur(4px); }
      }
      .vendor-modal-backdrop { animation: vendorBackdropFadeIn 0.25s ease-out; }
      .vendor-modal-content { animation: vendorModalSlideIn 0.25s ease-out; }
    `}</style>

    <div
      className="vendor-modal-backdrop"
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
      onClick={() => setOpen(false)}
    >
      <div
        className="vendor-modal-content"
        style={{
          ...EOcardStyles.base,
          maxWidth: "40rem",
          width: "90%",
          position: "relative",
          padding: "1.75rem 1.75rem 1.5rem",
          border: `2px solid ${EOcolors.lightSilver}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setOpen(false)}
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
        <div
          style={{
            marginBottom: "1.25rem",
            paddingRight: "2.5rem",
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                color: EOcolors.secondary,
                margin: "0 0 0.4rem 0",
              }}
            >
              Vendor Request Details
            </h2>
            <p
              style={{
                color: EOcolors.text.secondary,
                margin: 0,
                fontSize: "0.95rem",
              }}
            >
              Review vendor, event information, booth setup and attendees.
            </p>
          </div>

          {selected && (
            <span
              style={{
                ...(selected.status === "Accepted"
                  ? EObadgeStyles.success
                  : selected.status === "Rejected"
                  ? EObadgeStyles.error
                  : EObadgeStyles.pending),
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
              }}
            >
              {selected.status || "-"}
            </span>
          )}
        </div>

        {selected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Row 1 – Vendor + Event + Created */}
            <section
              style={{
                padding: "0.9rem 1rem",
                borderRadius: EOradius.lg,
                border: `1px solid ${EOcolors.lightSilver}`,
                background: `${EOcolors.light}08`,
                display: "grid",
                gridTemplateColumns: "1.7fr 1.7fr 1.2fr",
                gap: "1rem",
              }}
            >
              {/* Vendor */}
              <div>
                <Label
                  className="text-xs uppercase"
                  style={{
                    color: EOcolors.text.muted,
                    letterSpacing: "0.08em",
                  }}
                >
                  Vendor
                </Label>
                <div
                  style={{
                    marginTop: "0.15rem",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: EOcolors.text.primary,
                  }}
                >
                  {getVendorDisplayName(selected)}
                </div>
                {selected.companyName && (
                  <div
                    style={{
                      marginTop: "0.1rem",
                      fontSize: "0.8rem",
                      color: EOcolors.text.muted,
                    }}
                  >
                    {selected.companyName}
                  </div>
                )}
              </div>

              {/* Event */}
              <div>
                <Label
                  className="text-xs uppercase"
                  style={{
                    color: EOcolors.text.muted,
                    letterSpacing: "0.08em",
                  }}
                >
                  Event
                </Label>
                {(() => {
                  const { title, eventCategory } = readEvent(selected);
                  return (
                    <>
                      <div
                        style={{
                          marginTop: "0.15rem",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: EOcolors.text.primary,
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          marginTop: "0.1rem",
                          fontSize: "0.8rem",
                          color: EOcolors.text.muted,
                        }}
                      >
                        {eventCategory || "-"}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Created */}
              <div>
                <Label
                  className="text-xs uppercase"
                  style={{
                    color: EOcolors.text.muted,
                    letterSpacing: "0.08em",
                  }}
                >
                  Created
                </Label>
                <div
                  style={{
                    marginTop: "0.15rem",
                    fontSize: "0.9rem",
                    color: EOcolors.text.primary,
                  }}
                >
                  {readEvent(selected).date}
                </div>
              </div>
            </section>

            {/* Row 2 – Booth & Setup */}
            <section
              style={{
                padding: "0.9rem 1rem",
                borderRadius: EOradius.lg,
                border: `1px solid ${EOcolors.lightSilver}`,
              }}
            >
              <Label
                className="text-xs uppercase"
                style={{
                  color: EOcolors.text.muted,
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "0.45rem",
                }}
              >
                Booth & Setup
              </Label>

              {(() => {
                const { size, setupLocation, setupDuration } = readBooth(selected);
                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: EOcolors.text.muted,
                          marginBottom: "0.15rem",
                        }}
                      >
                        Booth Size
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: EOcolors.text.primary,
                        }}
                      >
                        {size || "-"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: EOcolors.text.muted,
                          marginBottom: "0.15rem",
                        }}
                      >
                        Setup Location
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: EOcolors.text.primary,
                        }}
                      >
                        {setupLocation || "-"}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: EOcolors.text.muted,
                          marginBottom: "0.15rem",
                        }}
                      >
                        Setup Duration
                      </div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: EOcolors.text.primary,
                        }}
                      >
                        {setupDuration || "-"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>

            {/* Row 3 – Attendees */}
            <section
              style={{
                padding: "0.9rem 1rem",
                borderRadius: EOradius.lg,
                border: `1px solid ${EOcolors.lightSilver}`,
              }}
            >
              <Label
                className="text-xs uppercase"
                style={{
                  color: EOcolors.text.muted,
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: "0.35rem",
                }}
              >
                Attendees (max 5)
              </Label>

              {(() => {
                const attendees = readAttendees(selected);
                if (!attendees.length) {
                  return (
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: EOcolors.text.muted,
                      }}
                    >
                      No attendees provided.
                    </div>
                  );
                }
                return (
                  <ul
                    style={{
                      marginTop: "0.1rem",
                      paddingLeft: "1.25rem",
                      fontSize: "0.9rem",
                      color: EOcolors.text.primary,
                      listStyleType: "disc",
                    }}
                  >
                    {attendees.map((a, i) => (
                      <li key={i}>
                        {a?.name || a?.fullName || "Unknown"}{" "}
                        {a?.email && (
                          <span style={{ color: EOcolors.text.muted }}>
                            &lt;{a.email}&gt;
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </section>

            {/* Row 4 – Additional details */}
            {(selected.notes ||
              (Array.isArray(selected.products) &&
                selected.products.length > 0)) && (
              <section
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: EOradius.lg,
                  border: `1px solid ${EOcolors.lightSilver}`,
                }}
              >
                <Label
                  className="text-xs uppercase"
                  style={{
                    color: EOcolors.text.muted,
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: "0.35rem",
                  }}
                >
                  Additional Details
                </Label>

                {selected.notes && (
                  <p
                    style={{
                      margin: "0 0 0.4rem 0",
                      fontSize: "0.9rem",
                      color: EOcolors.text.primary,
                    }}
                  >
                    {selected.notes}
                  </p>
                )}

                {Array.isArray(selected.products) &&
                  selected.products.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.4rem",
                        marginTop: selected.notes ? "0.25rem" : 0,
                      }}
                    >
                      {selected.products.map((p, i) => (
                        <span
                          key={i}
                          style={{
                            ...EObadgeStyles.info,
                            fontSize: "0.75rem",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
              </section>
            )}

            {/* Row 5 – Status + actions */}
            <section
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginTop: "0.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                }}
              >
                <Label
                  className="text-xs uppercase"
                  style={{
                    color: EOcolors.text.muted,
                    letterSpacing: "0.08em",
                  }}
                >
                  Status
                </Label>
                <div
                  style={{
                    fontSize: "0.9rem",
                    textTransform: "capitalize",
                    color: EOcolors.text.primary,
                  }}
                >
                  {selected.status ?? "-"}
                </div>
              </div>

              <div style={{ flex: 1 }} />

              <div
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  style={{
                    ...EObuttonStyles.primary,
                    background: "#10B981",
                    padding: "0.5rem 1.1rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => handleStatusChange(selected._id, "Accepted")}
                  disabled={selected?.status === "Accepted"}
                >
                  Accept
                </button>
                <button
                  style={{
                    ...EObuttonStyles.primary,
                    background: EOcolors.error,
                    padding: "0.5rem 1.1rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => handleStatusChange(selected._id, "Rejected")}
                  disabled={selected?.status === "Rejected"}
                >
                  Reject
                </button>
                <button
                  style={{
                    ...EObuttonStyles.outline,
                    padding: "0.5rem 1.1rem",
                    fontSize: "0.875rem",
                  }}
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div
            className="text-sm"
            style={{ color: EOcolors.text.muted, marginTop: "0.5rem" }}
          >
            No request selected.
          </div>
        )}
      </div>
    </div>
  </>
)}

      </div>
    </>
  );
}
