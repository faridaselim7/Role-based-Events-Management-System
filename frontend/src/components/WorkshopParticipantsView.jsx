// src/components/workshops/WorkshopParticipantsView.jsx
import React, { useState, useEffect } from "react";
import { Users, Calendar, CheckCircle, Mail, Clock, CreditCard, User, AlertCircle } from "lucide-react";
import { CardSkeleton } from "../components/LoadingEmptyStates";
import {
  EOcolors,
  EOshadows,
  EOtypography,
  EOradius,
  EOtransitions,
  EOcardStyles,
  EOalertStyles,
} from "../styles/EOdesignSystem";

const WorkshopParticipantsView = ({ workshopId }) => {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try { setCurrentUser(JSON.parse(user)); } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5001/api/workshops/${workshopId}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load participants");
        const data = await res.json();
        setWorkshop(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [workshopId]);

  if (loading) return <CardSkeleton count={6} />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6" style={{ backgroundColor: `${EOcolors.error}15` }}>
          <AlertCircle className="w-12 h-12" style={{ color: EOcolors.error }} />
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: EOcolors.secondary }}>
          {error}
        </h2>
      </div>
    );
  }

  const { title, totalCapacity, registeredCount, remainingSpots, participants = [] } = workshop;
  const attendedCount = participants.filter(p => p.status === "attended").length;
  const attendanceRate = registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0;

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .stat-card { animation: fadeInUp 0.6s ease-out; transition: ${EOtransitions.normal}; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: ${EOshadows.lg}; }
        .participants-card { animation: slideInDown 0.5s ease-out; }
        .participant-item { transition: ${EOtransitions.normal}; }
        .participant-item:hover { transform: translateX(6px); box-shadow: ${EOshadows.md}; }
      `}</style>

      <div className="max-w-8xl mx-auto px-6 py-12 min-h-screen">

        {/* Header: Title + Wallet (exact same as EventRegistration) */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 style={{
              fontSize: "3rem",
              fontWeight: "800",
              color: EOcolors.secondary,
              margin: "0 0 0.75rem 0",
              letterSpacing: "-0.02em",
            }}>
              {title}
            </h1>
            <p style={{
              fontSize: "1.125rem",
              color: EOcolors.text.secondary,
              margin: 0,
            }}>
              Participants Overview & Attendance Tracking
            </p>
          </div>
        </div>

        {/* Stats Grid - Same style as EventRegistration cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {[
            { label: "Total Capacity", value: totalCapacity, icon: Users, color: EOcolors.primary },
            { label: "Registered", value: registeredCount, icon: CheckCircle, color: EOcolors.secondary },
            { label: "Spots Left", value: remainingSpots, icon: Calendar, color: remainingSpots <= 5 ? EOcolors.error : EOcolors.tertiary },
            { label: "Attendance", value: `${attendanceRate}%`, icon: Clock, color: EOcolors.success },
          ].map((stat, i) => (
            <div
              key={i}
              className="stat-card rounded-3xl p-8 text-white"
              style={{
                background: `linear-gradient(135deg, ${stat.color}, ${stat.color}ee)`,
                boxShadow: EOshadows.lg,
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <stat.icon className="w-10 h-10 opacity-90" />
                {stat.label === "Spots Left" && remainingSpots <= 5 && (
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                    LOW
                  </span>
                )}
              </div>
              <div className="text-5xl font-black mb-2">{stat.value}</div>
              <div className="text-lg opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Participants Card - Exact same style */}
        <div className="bg-white rounded-3xl overflow-hidden" style={{
          ...EOcardStyles.base,
          border: `2px solid ${EOcolors.lightSilver}`,
          boxShadow: EOshadows.xl,
        }}>
          {/* Card Header */}
          <div style={{
            padding: "2rem 2.5rem",
            backgroundColor: EOcolors.light,
            borderBottom: `1px solid ${EOcolors.lightSilver}`,
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            borderRadius: EOradius.xl,
          }}>
            <div style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: EOradius.xl,
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: EOshadows.sm,
            }}>
              <Users className="w-8 h-8" style={{ color: EOcolors.primary }} />
            </div>
            <div>
              <h2 style={{
                fontSize: "1.75rem",
                fontWeight: "800",
                color: EOcolors.secondary,
                margin: "0 0 0.25rem 0",
              }}>
                Registered Participants
              </h2>
              <p style={{
                fontSize: "1rem",
                color: EOcolors.text.secondary,
                margin: 0,
              }}>
                {registeredCount} {registeredCount === 1 ? "student" : "students"} registered
              </p>
            </div>
          </div>

          {/* Participants List */}
          <div style={{ padding: "2.5rem" }}>
            {participants.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: EOcolors.light }}>
                  <Users className="w-16 h-16" style={{ color: "#D1D5DB" }} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: EOcolors.text.primary }}>
                  No registrations yet
                </h3>
                <p style={{ color: EOcolors.text.secondary, marginTop: "0.5rem" }}>
                  Students will appear here once they register.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {participants.map((p, i) => {
                  const isAttended = p.status === "attended";
                  return (
                    <div
                      key={p.userId}
                      className="participant-item rounded-2xl p-8 border-2 transition-all"
                      style={{
                        borderColor: isAttended ? EOcolors.success : EOcolors.lightSilver,
                        backgroundColor: isAttended ? `${EOcolors.success}08` : "white",
                        boxShadow: EOshadows.sm,
                      }}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-30 h-16 rounded-2xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white font-bold text-xl">
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <div>
                            <h4 style={{ fontSize: "1.375rem", fontWeight: "800", color: EOcolors.secondary, margin: "0 0 0.5rem 0" }}>
                              {p.firstName} {p.lastName}
                            </h4>
                            <div className="space-y-2 text-sm" style={{ color: EOcolors.text.secondary }}>
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4" />
                                <span>{p.email}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4" />
                                <span>{p.studentOrStaffId} • {p.role || "Student"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="px-6 py-3 rounded-full font-bold text-white text-sm" style={{
                            backgroundColor: isAttended ? EOcolors.success : EOcolors.primary,
                          }}>
                            {isAttended ? "Attended" : "Registered"}
                          </span>
                          <span style={{ color: EOcolors.text.secondary, fontSize: "0.9375rem" }}>
                            {new Date(p.registeredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkshopParticipantsView;