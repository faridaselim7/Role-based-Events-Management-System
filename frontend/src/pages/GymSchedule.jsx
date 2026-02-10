import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, Users, CheckCircle, X, Package, Store } from "lucide-react";
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

const GymSchedule = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Color palette matching vendor dashboard
  const colors = {
    primary: '#307B8E',      // Teal
    secondary: '#A9D3C5',    // Light Teal
    tertiary: '#CEE5D6',     // Soft Mint
    accent: '#103A57',       // Deep Prussian
    light: '#F8FAFB'         // Light background
  };

  // Map gym types to colors and labels
  const GYM_SESSION_SCHEMA = {
    yoga: { label: "Yoga", color: '#366B2B' },
    pilates: { label: "Pilates", color: colors.primary },
    aerobics: { label: "Aerobics", color: colors.accent },
    zumba: { label: "Zumba", color: colors.secondary },
    cross_circuit: { label: "Cross Circuit", color: colors.tertiary },
    kick_boxing: { label: "Kick-boxing", color: colors.primary },
  };

  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
    
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await axios.get("http://localhost:5001/api/GymSession", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Filter upcoming sessions only and sort by date
      const now = new Date();
      const upcomingSessions = res.data
        .filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= now && session.status === 'published';
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setSessions(upcomingSessions);
    } catch (err) {
      console.error("Error fetching gym schedule:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error("Authentication required. Please log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (session) => {
    setSelectedSession(session);
    setShowRegistrationModal(true);
  };

  const confirmRegistration = async () => {
    if (!selectedSession || !currentUser) return;

    setRegistering(selectedSession._id);
    
    try {
      const token = localStorage.getItem("token");
      
      const registrationData = {
        sessionId: selectedSession._id,
        userId: currentUser._id || currentUser.id,
        name: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`,
        role: currentUser.role
      };

      const res = await axios.post(
        "http://localhost:5001/api/GymSession/register",
        registrationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (res.status === 200 || res.status === 201) {
        alert(`✅ Successfully registered for ${selectedSession.type} session!`);
        
        // Refresh sessions to show updated participant count
        await fetchSchedule();
        
        setShowRegistrationModal(false);
        setSelectedSession(null);
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      let errorMessage = "Failed to register for session.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Session is full or you're already registered.";
      } else if (err.response?.status === 401) {
        errorMessage = "Please log in to register.";
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setRegistering(null);
    }
  };

  // Check if user is already registered for a session
  const isUserRegistered = (session) => {
    if (!currentUser || !session.registrations) return false;
    
    const userId = currentUser._id || currentUser.id;
    return session.registrations.some(
      r => (r.userId === userId || r.userId === userId.toString())
    );
  };

  // Check if session is full
  const isSessionFull = (session) => {
    if (!session.registrations || !session.maxParticipants) return false;
    return session.registrations.length >= session.maxParticipants;
  };

  // Get available spots
  const getAvailableSpots = (session) => {
    const registered = session.registrations?.length || 0;
    const max = session.maxParticipants || 0;
    return max - registered;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const formatTime = (timeStr) => {
    if (!timeStr) return "TBA";
    // Handle both "HH:MM" and "HH:MM AM/PM" formats
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Status badge matching vendor applications style - EXACT COPY
  const statusBadge = (status) => {
    const badges = {
      registered: (
        <div 
          className="text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1"
          style={{
            background: '#D1FAE5',
            color: '#065F46',
            border: '2px solid #10B981'
          }}
        >
          <span>✓</span>
          <span>Registered</span>
        </div>
      ),
      full: (
        <div 
          className="text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1"
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            border: '2px solid #DC2626'
          }}
        >
          <span>✕</span>
          <span>Full</span>
        </div>
      ),
      available: (
        <div 
          className="text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1"
          style={{
            background: '#FEF3C7',
            color: '#92400E',
            border: '2px solid #F59E0B'
          }}
        >
          <span>⏳</span>
          <span>Available</span>
        </div>
      ),
    };
    return badges[status] || badges.available;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.accent }}>Loading gym schedule...</p>
        </div>
      </div>
    );
  }

  // Empty state component
  const NoBazaarsState = () => (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: colors.light,
        border: `2px dashed ${colors.tertiary}`,
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ background: colors.tertiary }}
      >
        <Calendar className="w-10 h-10" style={{ color: colors.primary }} />
      </div>
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: colors.accent }}
      >
        No Upcoming Gym Sessions
      </h3>
      <p style={{ color: "#6B7280" }}>
        Check back later for new gym session schedules.
      </p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gym-session-card {
          animation: slideInUp 0.4s ease-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gym-session-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px ${colors.primary}20;
          border-color: ${colors.secondary};
        }

        .action-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 28px ${colors.primary}50;
        }
          .eo-title-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #cbd5e1, transparent);
    margin-top: 1.5rem;
    margin-bottom: 2.5rem;
  }
      `}</style>

      <div className="space-y-8">
        {/* ADD THIS TITLE BLOCK HERE */}
  <div className="pt-8 pb-2">
    <h1 style={{
      fontSize: "2.5rem",
      fontWeight: "900",
      color: EOcolors.secondary,
      margin: "0 0 0.5rem 0",
      letterSpacing: "-0.03em",
      textShadow: "0 4px 12px rgba(16, 58, 87, 0.15)",
      textAlign: "left",
    }}>
      Gym Sessions
    </h1>
    <p style={{
      fontSize: "1.125rem",
      color: EOcolors.text.secondary,
      fontWeight: "500",
      margin: 0,
      opacity: 0.9,
      textAlign: "left",
    }}>
      Book your spot for upcoming fitness classes at GUC Gym
    </p>
    <div className="eo-title-divider-strong"></div>
  </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <NoBazaarsState />
        ) : (
          <div className="space-y-6">
            {sessions.map((session, index) => {
              const sessionDate = new Date(session.date);
              const isToday = sessionDate.toDateString() === new Date().toDateString();
              const registered = isUserRegistered(session);
              const full = isSessionFull(session);
              const availableSpots = getAvailableSpots(session);
              const typeKey = session.type?.toLowerCase();
              const typeSchema = GYM_SESSION_SCHEMA[typeKey] || { label: session.type, color: colors.primary };
              
              // Determine status for badge
              let sessionStatus = 'available';
              if (registered) sessionStatus = 'registered';
              else if (full) sessionStatus = 'full';

              return (
                <div
                  key={session._id}
                  className="gym-session-card bg-white rounded-2xl shadow-lg"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    border: registered ? `3px solid #10B981` : `2px solid ${colors.tertiary}`,
                    boxShadow: `0 4px 12px ${colors.accent}08`
                  }}
                  
                >
                  <div className="p-8">
                    <div className="flex items-start gap-6">
                      {/* Date Box - Matching Vendor Style */}
                      <div 
                        className="flex-shrink-0 text-center p-6 rounded-2xl"
                        style={{
                          background: colors.light,
                          minWidth: '140px',
                          border: `2px solid ${colors.tertiary}`,
                          boxShadow: `0 4px 12px ${colors.accent}05`
                        }}
                      >
                        <div 
                          className="text-xs font-bold mb-2 tracking-wider"
                          style={{ color: '#6B7280' }}
                        >
                          {isToday ? 'TODAY' : formatDate(session.date).toUpperCase()}
                        </div>
                        <div 
                          className="text-3xl font-bold mb-3"
                          style={{ color: colors.accent }}
                        >
                          {formatTime(session.time)}
                        </div>
                        
                        {/* Status Badge */}
                        {statusBadge(sessionStatus)}
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        {/* Title & Type Badge */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                                style={{ 
                                  backgroundColor: typeSchema.color,
                                  boxShadow: `0 4px 12px ${typeSchema.color}30`
                                }}
                              >
                                {typeSchema.label}
                              </span>
                              {registered && (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              )}
                            </div>
                            <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>
                              Join us for a {session.durationMins}-minute {typeSchema.label.toLowerCase()} session at GUC Gym
                            </p>
                          </div>
                        </div>

                        {/* Details Grid - Matching Vendor Style */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: colors.tertiary }}
                            >
                              <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Date</div>
                              <div className="text-sm font-bold truncate" style={{ color: colors.accent }}>
                                {formatDate(session.date)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: colors.tertiary }}
                            >
                              <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Duration</div>
                              <div className="text-sm font-bold truncate" style={{ color: colors.accent }}>
                                {session.durationMins} minutes
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: colors.tertiary }}
                            >
                              <Users className="w-5 h-5" style={{ color: colors.primary }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium" style={{ color: '#6B7280' }}>Capacity</div>
                              <div className="text-sm font-bold truncate" style={{ color: full ? '#DC2626' : colors.primary }}>
                                {session.registrations?.length || 0}/{session.maxParticipants} ({availableSpots} left)
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Participants Chips - Matching Vendor Style */}
                        {registered && session.registrations && session.registrations.length > 0 && (
                          <div className="mb-6">
                            <div className="text-xs font-semibold mb-3" style={{ color: '#6B7280' }}>
                              REGISTERED PARTICIPANTS ({session.registrations.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {session.registrations.slice(0, 6).map((reg, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                  style={{
                                    background: colors.tertiary,
                                    border: `1px solid ${colors.secondary}`
                                  }}
                                >
                                  <div 
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: colors.primary }}
                                  >
                                    {reg.name ? reg.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <span className="text-xs font-semibold" style={{ color: colors.accent }}>
                                    {reg.name || 'User'}
                                  </span>
                                </div>
                              ))}
                              {session.registrations.length > 6 && (
                                <div 
                                  className="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold"
                                  style={{ background: colors.tertiary, color: colors.accent }}
                                >
                                  +{session.registrations.length - 6} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Location Info */}
                        <div 
                          className="mb-6 p-4 rounded-xl flex items-center gap-3"
                          style={{
                            background: colors.light,
                            border: `2px solid ${colors.tertiary}`
                          }}
                        >
                          <Package className="w-5 h-5" style={{ color: colors.primary }} />
                          <div className="flex-1">
                            <div className="text-sm font-bold" style={{ color: colors.accent }}>
                              📍 GUC Gym
                            </div>
                            <div className="text-xs" style={{ color: '#6B7280' }}>
                              German University in Cairo
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Matching Vendor Style */}
                        <div className="flex flex-wrap gap-3">
                          {registered ? (
                            <div 
                              className="flex items-center gap-3 px-6 py-3 rounded-xl flex-1"
                              style={{
                                background: '#D1FAE5',
                                border: '2px solid #10B981'
                              }}
                            >
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div className="flex-1">
                                <div className="text-sm font-bold" style={{ color: '#065F46' }}>
                                  You're Registered!
                                </div>
                                <div className="text-xs" style={{ color: '#065F46' }}>
                                  See you at the session
                                </div>
                              </div>
                            </div>
                          ) : full ? (
                            <button
                              disabled
                              className="flex-1 px-6 py-3 rounded-xl text-center font-bold text-sm"
                              style={{
                                background: '#FEE2E2',
                                color: '#991B1B',
                                border: '2px solid #FCA5A5',
                                cursor: 'not-allowed'
                              }}
                            >
                              Session Full - No Spots Available
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRegister(session)}
                              disabled={registering === session._id}
                              className="action-btn px-8 py-3 rounded-xl font-bold text-sm text-white"
                              style={{
                                background: registering === session._id ? '#9CA3AF' : colors.primary,
                                border: 'none',
                                cursor: registering === session._id ? 'wait' : 'pointer',
                                boxShadow: registering === session._id ? 'none' : `0 6px 20px ${colors.primary}40`,
                                minWidth: '160px'
                              }}
                            >
                              {registering === session._id ? 'Registering...' : 'Register Now'}
                            </button>
                          )}
                        </div>

                        {/* Warning if few spots left */}
                        {!registered && !full && availableSpots <= 3 && (
                          <div 
                            className="mt-4 p-3 rounded-lg flex items-center gap-2"
                            style={{
                              background: '#FEF3C7',
                              border: '2px solid #F59E0B'
                            }}
                          >
                            <span className="text-xl">⚠️</span>
                            <span className="text-sm font-bold" style={{ color: '#92400E' }}>
                              Hurry! Only {availableSpots} spot{availableSpots !== 1 ? 's' : ''} remaining
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration Modal - Matching Vendor Style */}
      {showRegistrationModal && selectedSession && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowRegistrationModal(false);
            setSelectedSession(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full 
             min-h-[600px] max-h-[92vh] overflow-y-auto p-6"       
    onClick={(e) => e.stopPropagation()}
            style={{ border: `3px solid ${colors.primary}` }}
          >
            {/* Modal Header */}
            <div 
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: colors.tertiary }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: colors.secondary }}
                >
                  <Users className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: colors.accent }}>
                  Confirm Registration
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedSession(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Session Details */}
              <div 
                className="rounded-xl p-5"
                style={{ background: colors.light, border: `2px solid ${colors.tertiary}` }}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#6B7280' }}>
                      SESSION TYPE
                    </p>
                    <p className="text-lg font-bold" style={{ color: colors.accent }}>
                      {GYM_SESSION_SCHEMA[selectedSession.type?.toLowerCase()]?.label || selectedSession.type}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#6B7280' }}>
                        DATE
                      </p>
                      <p className="text-sm font-bold" style={{ color: colors.accent }}>
                        {formatDate(selectedSession.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#6B7280' }}>
                        TIME
                      </p>
                      <p className="text-sm font-bold" style={{ color: colors.accent }}>
                        {formatTime(selectedSession.time)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1 tracking-wider" style={{ color: '#6B7280' }}>
                      DURATION
                    </p>
                    <p className="text-sm font-bold" style={{ color: colors.accent }}>
                      {selectedSession.durationMins} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {currentUser && (
                <div 
                  className="rounded-xl p-5"
                  style={{ background: colors.secondary }}
                >
                  <p className="text-xs font-bold mb-3 tracking-wider" style={{ color: '#6B7280' }}>
                    REGISTERING AS
                  </p>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: colors.primary }}
                    >
                      {(currentUser.name || currentUser.firstName)?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: colors.accent }}>
                        {currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`}
                      </p>
                      <p className="text-sm capitalize" style={{ color: '#6B7280' }}>
                        {currentUser.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if few spots */}
              {getAvailableSpots(selectedSession) <= 3 && getAvailableSpots(selectedSession) > 0 && (
                <div 
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}
                >
                  <span className="text-2xl">⚠️</span>
                  <p className="text-sm font-bold" style={{ color: '#92400E' }}>
                    Only {getAvailableSpots(selectedSession)} spot{getAvailableSpots(selectedSession) !== 1 ? 's' : ''} remaining!
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="p-6 border-t flex gap-3"
              style={{ borderColor: colors.tertiary }}
            >
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setSelectedSession(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold transition-all"
                style={{
                  background: '#FEE2E2',
                  color: '#66023C',
                  border: '2px solid #FCA5A5'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRegistration}
                disabled={registering}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold transition-all"
                style={{
                  background: registering ? '#9CA3AF' : colors.primary,
                  cursor: registering ? 'wait' : 'pointer',
                  boxShadow: registering ? 'none' : `0 6px 20px ${colors.primary}40`
                }}
              >
                {registering ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GymSchedule;