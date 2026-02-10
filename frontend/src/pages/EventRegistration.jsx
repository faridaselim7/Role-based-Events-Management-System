// src/pages/EventRegistration.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Users,
  ShoppingCart,
  Trash2,
  CreditCard,
  CheckCircle,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import PaymentModal from "./PayementModal";
import {
  EOcolors,
  EOcardStyles,
  EOradius,
} from "../styles/EOdesignSystem";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

const fetchProfessorNames = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const responses = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`);
        if (!res.ok) return null;
        const prof = await res.json();
        return `${prof.firstName} ${prof.lastName}`.trim();
      } catch {
        return null;
      }
    })
  );
  return responses.filter(Boolean);
};

export default function EventRegistrationPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [error, setError] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "").trim();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const freshUser = data.user || data; // ✅ always store the inner user object
      localStorage.setItem("user", JSON.stringify(freshUser));
      setCurrentUser(freshUser);
      toast.success("Google Calendar connected successfully!");
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  // Prefill user info from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);

      // handle nested user object safely
      const u =
        parsed?.user && typeof parsed.user === "object" ? parsed.user : parsed;

      setCurrentUser(u);

      console.log("✅ Loaded user from localStorage:", {
        email: u.email,
        wallet: u.wallet,
        role: u.role,
      });
    } catch (e) {
      console.error("❌ Failed to parse user", e);
    }
  }, []);

  // Fetch user's existing registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!currentUser?.email) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/registrations/user/email/${currentUser.email}`
        );

        if (!res.ok) return;

        const data = await res.json();
        const eventIds = (data.data || [])
          .filter((reg) => reg.status === "registered")
          .map((reg) => reg.eventId?._id || reg.eventId)
          .filter(Boolean);

        setRegisteredEventIds(eventIds);
      } catch (err) {
        console.error("Error fetching registrations:", err);
      }
    };

    fetchRegistrations();
  }, [currentUser]);

  // Listen for cancellation event (refund + remove)
  useEffect(() => {
    const handleCancellation = (event) => {
      const { eventId } = event.detail || {};
      if (!eventId) return;

      setRegisteredEventIds((prev) => prev.filter((id) => id !== eventId));

      if (event.detail?.newWallet !== undefined && currentUser) {
        const updatedUser = { ...currentUser, wallet: event.detail.newWallet };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    };

    window.addEventListener("registrationCancelled", handleCancellation);
    return () =>
      window.removeEventListener("registrationCancelled", handleCancellation);
  }, [currentUser]);

  // Fetch workshops + trips with proper capacity tracking + role restrictions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ determine userRole (handle nested user shape)
        let userRole = "";
        try {
          const rawUser = localStorage.getItem("user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            const u =
              parsed?.user && typeof parsed.user === "object"
                ? parsed.user
                : parsed;

            const key = String(u.role || u.userType || "").toLowerCase().trim();

            if (key === "student") userRole = "student";
            else if (key === "staff") userRole = "staff";
            else if (key === "ta" || key === "teaching assistant") userRole = "ta";
            else if (key === "professor" || key === "lecturer") userRole = "professor";
          }
        } catch (e) {
          console.warn("Could not read user from localStorage", e);
        }

        const now = new Date();

        // Workshops
        const workshopsRaw = await fetch(`${API_BASE}/api/events/workshops`).then(
          (r) => r.json()
        );
        const workshopsArray = Array.isArray(workshopsRaw)
          ? workshopsRaw
          : workshopsRaw.workshops || [];

        const workshopsList = await Promise.all(
          workshopsArray
            .filter((w) => {
              const eventDate = new Date(w.startDate || w.date);
              const regDeadline = w.registrationDeadline
                ? new Date(w.registrationDeadline)
                : null;
              return eventDate > now && (!regDeadline || regDeadline > now);
            })
            .map(async (w) => {
              const names = await fetchProfessorNames(w.professorsParticipating);
              const allProfessors = [w.facultyResponsible, ...names]
                .filter(Boolean)
                .join(", ");

              return {
                _id: w._id,
                displayName: w.title,
                description: w.description,
                date: w.startDate,
                startDate: w.startDate,
                endDate: w.endDate,
                location: w.location,
                type: "Workshop",
                eventType: "workshop",
                fee: w.price || 0,
                professors: allProfessors,
                maxCapacity: w.capacity || w.maxParticipants || 50,
                currentRegistrations: w.registeredCount || 0,
                allowedUserTypes: w.allowedUserTypes || [],
              };
            })
        );

        // Trips
        const tripsRes = await fetch(`${API_BASE}/api/events/trips`);
        const tripsData = tripsRes.ok ? await tripsRes.json() : { trips: [] };
        const tripsArray = Array.isArray(tripsData) ? tripsData : tripsData.trips || [];

        const tripsList = (tripsArray || [])
          .filter((t) => {
            const eventDate = new Date(t.startDateTime || t.startDate || t.date);
            const regDeadline = t.registrationDeadline
              ? new Date(t.registrationDeadline)
              : null;
            return eventDate > now && (!regDeadline || regDeadline > now);
          })
          .map((t) => ({
            _id: t._id,
            displayName: t.name,
            description: t.description,
            date: t.startDateTime || t.startDate || t.date,
            startDate: t.startDateTime || t.startDate || t.date,
            endDate: t.endDateTime || t.endDate,
            location: t.location,
            type: "Trip",
            eventType: "trip",
            fee: t.price || t.fee || 250,
            maxCapacity: t.capacity || t.maxParticipants || 30,
            currentRegistrations: t.registeredCount || 0,
            allowedUserTypes: t.allowedUserTypes || [],
          }));

        // Apply user-type restrictions
        const applyUserTypeRestriction = (list) =>
          list.filter((item) => {
            const allowed = (item.allowedUserTypes || []).map((r) =>
              String(r).toLowerCase().trim()
            );
            if (allowed.length === 0) return true;
            if (!userRole) return false;
            return allowed.includes(userRole);
          });

        const restrictedWorkshops = applyUserTypeRestriction(workshopsList);
        const restrictedTrips = applyUserTypeRestriction(tripsList);

        const all = [...restrictedWorkshops, ...restrictedTrips].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setEvents(all);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
        setError("Failed to load events. Please try again.");
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load cart from localStorage when user changes
  useEffect(() => {
    if (!currentUser?.email) return;
    const cartKey = `cart_${currentUser.email}`;
    const savedCart = localStorage.getItem(cartKey);

    if (!savedCart) return;

    try {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
    } catch (e) {
      console.error("Failed to parse saved cart", e);
    }
  }, [currentUser?.email]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!currentUser?.email) return;
    const cartKey = `cart_${currentUser.email}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, currentUser?.email]);

  const addToCart = (event) => {
    if (!event) return toast.error("Invalid event");

    if (registeredEventIds.includes(event._id)) {
      toast.error("You're already registered for this event");
      return;
    }

    if (cart.some((item) => item._id === event._id)) {
      toast.info("Already in cart");
      return;
    }

    const currentCount = event.currentRegistrations || 0;
    const maxCount = event.maxCapacity || 50;
    if (currentCount >= maxCount) {
      toast.error("This event is full");
      return;
    }

    setCart((prev) => [...prev, event]);
    toast.success(`Added "${event.displayName}" to cart`);
  };

  const removeFromCart = (id) => {
    const removed = cart.find((item) => item._id === id);
    setCart((prev) => prev.filter((item) => item._id !== id));
    if (removed) toast.info(`Removed "${removed.displayName}" from cart`);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.fee || 0), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!currentUser) return toast.error("Please log in to register");

    setCartOpen(false);

    if (totalAmount === 0) {
      handlePaymentSuccess("none", null);
    } else {
      setPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = async (method, paymentIntentId) => {
    try {
      if (!currentUser) {
        toast.error("User not found. Please log in again.");
        return;
      }

      // Wallet validation
      if (method === "wallet") {
        const walletBalance = Number(currentUser.wallet || 0);
        if (walletBalance < totalAmount) {
          toast.error(
            `Insufficient wallet balance. You have ${walletBalance.toFixed(
              2
            )} but need ${totalAmount.toFixed(2)}`
          );
          return;
        }
      }

      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "").trim();

      // Normalize userType for backend
      const getUserType = (role) => {
        const normalized = String(role || "").toLowerCase().trim();
        if (normalized === "teaching assistant" || normalized === "ta") return "TA";
        if (normalized === "professor" || normalized === "lecturer") return "Professor";
        if (normalized === "staff") return "Staff";
        return "Student";
      };

      const normalizedUserType = getUserType(currentUser.role || currentUser.userType);

      const registrations = cart.map((event) => ({
        name: `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim(),
        email: currentUser.email,
        userId: currentUser._id || currentUser.id,
        userType: normalizedUserType,
        eventId: event._id,
        eventType: event.eventType,
        amountPaid: event.fee || 0,
        paymentMethod: method,
        stripePaymentIntentId: method === "stripe" ? paymentIntentId : undefined,
      }));

      const res = await fetch(`${API_BASE}/api/registrations/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          currentUser: currentUser._id || currentUser.id,
          registrations,
        }),
      });

      let responseData;
      try {
        responseData = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(responseData?.message || `Registration failed (${res.status})`);
      }

      // Wallet update (backend-first, fallback-second)
      const newWallet =
        responseData?.user?.wallet ??
        responseData?.user?.user?.wallet; // if backend wraps again

      if (newWallet !== undefined) {
        const updatedUser = { ...currentUser, wallet: newWallet };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else if (method === "wallet" && totalAmount > 0) {
        const updatedWallet = Number(currentUser.wallet || 0) - totalAmount;
        const updatedUser = { ...currentUser, wallet: updatedWallet };
        setCurrentUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      // Success / errors
      const createdRegs = responseData?.registrations || [];
      const errors = responseData?.errors || [];

      const createdEventIds = createdRegs
        .map((r) => r.eventId?._id || r.eventId)
        .filter(Boolean);

      const attemptedEventIds = cart.map((c) => c._id);

      if (createdEventIds.length === attemptedEventIds.length) {
        toast.success(
          `✅ Successfully registered for ${createdEventIds.length} event${
            createdEventIds.length > 1 ? "s" : ""
          }!`
        );
      } else if (createdEventIds.length > 0) {
        toast.success(
          `✅ Registered for ${createdEventIds.length} new event${
            createdEventIds.length > 1 ? "s" : ""
          }!`
        );
        if (errors.length > 0) toast.info(`Some selections were already registered / failed.`);
      } else {
        toast.info("You are already registered for all selected events.");
      }

      if (errors.length > 0) {
        console.error("Registration errors:", errors);
        toast.error(errors[0]?.error || "Some registrations failed.");
      }

      // Google calendar handling (if backend returns these fields)
      if (responseData?.calendarResults) {
        const calendarSuccess = responseData.calendarResults.filter((r) => r.success).length;
        if (calendarSuccess > 0) {
          toast.success(
            `📅 ${calendarSuccess} event${calendarSuccess > 1 ? "s" : ""} added to Google Calendar!`
          );
        }
      } else if (String(responseData?.calendarError || "").includes("not connected")) {
        toast.info("Connect Google Calendar to auto-add events", {
          action: {
            label: "Connect",
            onClick: () => {
              const userId = currentUser._id || currentUser.id;
              window.open(
                `${API_BASE}/api/registrations/calendar/connect?userId=${userId}`,
                "google-connect",
                "width=600,height=700"
              );
            },
          },
        });
      }

      // Update registered IDs (union, so "already registered" still ends up tracked)
      setRegisteredEventIds((prev) => [
        ...new Set([...prev, ...attemptedEventIds]),
      ]);

      // Increment capacity ONLY for newly created registrations (avoid double-increment)
      if (createdEventIds.length > 0) {
        setEvents((prev) =>
          prev.map((e) =>
            createdEventIds.includes(e._id)
              ? { ...e, currentRegistrations: (e.currentRegistrations || 0) + 1 }
              : e
          )
        );
      }

      // Clear cart + close UI
      const cartKey = currentUser?.email ? `cart_${currentUser.email}` : null;
      setCart([]);
      if (cartKey) localStorage.removeItem(cartKey);

      setPaymentOpen(false);
      setCartOpen(false);
    } catch (err) {
      console.error("Payment/Registration error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
      setPaymentOpen(false);
    }
  };

  const availableEvents = events.filter((e) => !registeredEventIds.includes(e._id));

  return (
    <>
      <Toaster position="top-center" richColors />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .event-registration-container { animation: slideInDown 0.4s ease-out; }
        .registration-card {
          animation: fadeInUp 0.6s ease-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .registration-card:hover {
          box-shadow: 0 20px 40px rgba(45, 95, 79, 0.15);
          transform: translateY(-6px);
        }
        .event-card {
          animation: fadeInUp 0.6s ease-out both;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
        }
        .event-card:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 24px 48px rgba(45, 95, 79, 0.18);
          border-color: ${EOcolors.primary};
          background: linear-gradient(135deg, #ffffff 0%, #f0f5f3 100%);
        }
        .wallet-pill { animation: fadeInUp 0.5s ease-out; transition: all 0.3s ease; }
        .wallet-pill:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 24px rgba(45, 95, 79, 0.2); }

        .btn-register { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .btn-register:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: 0 16px 32px rgba(45, 95, 79, 0.3); }

        .cart-sidebar { animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .cart-overlay { animation: fadeIn 0.3s ease-out; }
      `}</style>

      <div className="event-registration-container min-h-screen bg-gradient-to-br from-[#f5f9f8] to-[#eef2f6] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Wallet */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1
                style={{
                  fontSize: "2.8rem",
                  fontWeight: "800",
                  color: EOcolors.secondary,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Event Registration
              </h1>
              <p style={{ fontSize: "1.25rem", color: EOcolors.text.secondary }}>
                Add multiple workshops & trips to your cart and pay once
              </p>
            </div>

            <div className="flex items-center gap-4">
              {currentUser && (
                <div
                  className="wallet-pill inline-flex items-center gap-4 px-8 py-5 rounded-2xl"
                  style={{
                    ...EOcardStyles.base,
                    border: `3px solid ${EOcolors.primary}`,
                    backgroundColor: "white",
                    boxShadow: "0 8px 24px rgba(45, 95, 79, 0.12)",
                  }}
                >
                  <div
                    style={{
                      width: "3.5rem",
                      height: "3.5rem",
                      borderRadius: EOradius.lg,
                      backgroundColor: EOcolors.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(45, 95, 79, 0.2)",
                    }}
                  >
                    <CreditCard style={{ width: "2rem", height: "2rem", color: "white" }} />
                  </div>
                  <div className="text-left">
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: EOcolors.text.secondary,
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Wallet Balance
                    </div>
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: "900",
                        color: EOcolors.secondary,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      ${Number(currentUser.wallet ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Google Calendar Connect Button */}
              {currentUser && !currentUser.googleCalendar?.connected && (
                <button
                  onClick={() => {
                    const userId = currentUser._id || currentUser.id;
                    if (!userId) {
                      toast.error("User ID not found. Please log in again.");
                      return;
                    }

                    const url = `${API_BASE}/api/registrations/calendar/connect?userId=${userId}`;
                    const popup = window.open(url, "google-connect", "width=600,height=700");

                    if (!popup) {
                      toast.error("Popup blocked. Please allow popups and try again.");
                      return;
                    }

                    const interval = setInterval(() => {
                      if (popup.closed) {
                        clearInterval(interval);
                        refreshUser();
                      }
                    }, 500);
                  }}
                  className="bg-[#4285F4] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#3367D6]"
                >
                  <Calendar className="w-5 h-5" />
                  Connect Google Calendar
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative bg-[#2D5F4F] text-white p-4 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <ShoppingCart className="w-8 h-8" />
                {cart.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-white text-[#2D5F4F] font-black text-sm w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-[#2D5F4F]">
                    {cart.length}
                  </div>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Events Grid */}
          <div className="space-y-8 mb-12">
            {loading ? (
              <div className="text-center py-20 text-gray-600 text-lg">Loading events...</div>
            ) : availableEvents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg registration-card">
                <Calendar className="w-16 h-16 mx-auto text-[#2D5F4F] mb-4" />
                <p className="text-2xl font-bold text-[#2D5F4F]">
                  {events.length > 0
                    ? "You're registered for all available events!"
                    : "No upcoming events"}
                </p>
                <p className="text-gray-600 mt-2">
                  {events.length > 0
                    ? "Check 'My Registered Events' to view your registrations"
                    : "Check back soon!"}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableEvents.map((event, index) => {
                  const inCart = cart.some((i) => i._id === event._id);
                  const isFull =
                    (event.currentRegistrations || 0) >= (event.maxCapacity || 50);
                  const isRegistered = registeredEventIds.includes(event._id);

                  return (
                    <div
                      key={event._id}
                      className="event-card registration-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl flex flex-col"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        borderLeft: `4px solid ${EOcolors.primary}`,
                        minHeight: "480px",
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-2">
                          <h3 className="text-xl font-black text-[#2D5F4F] mb-2 leading-tight line-clamp-2">
                            {event.displayName}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1.5 bg-[#f0f5f3] text-[#2D5F4F] font-bold rounded-lg text-xs border-2 border-[#2D5F4F]">
                              {event.type}
                            </span>
                            {isRegistered && (
                              <span className="inline-flex items-center px-3 py-1.5 bg-[#2D5F4F] text-white font-bold rounded-lg text-xs gap-1">
                                <CheckCircle className="w-3 h-3" /> Registered
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="bg-[#2D5F4F] px-4 py-2.5 rounded-xl shadow-md flex-shrink-0">
                          <p className="text-2xl font-black text-white">
                            ${(event.fee || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4 bg-[#f0f5f3] p-4 rounded-xl border border-[#e0e7e4]">
                        <div className="flex items-center gap-2">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-[#e0e7e4]">
                            <Calendar className="w-4 h-4 text-[#2D5F4F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Date
                            </p>
                            <span className="font-bold text-[#2D5F4F] text-sm truncate block">
                              {new Date(event.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-[#e0e7e4]">
                            <MapPin className="w-4 h-4 text-[#2D5F4F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Location
                            </p>
                            <span className="font-bold text-[#2D5F4F] text-sm truncate block">
                              {event.location || "TBD"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="bg-white p-2 rounded-lg shadow-sm border border-[#e0e7e4]">
                            <Users className="w-4 h-4 text-[#2D5F4F]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Capacity
                            </p>
                            <span className="font-bold text-[#2D5F4F] text-sm">
                              {event.currentRegistrations || 0} / {event.maxCapacity || 50}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        {event.professors && (
                          <div className="mb-4 p-3 bg-white rounded-lg border-l-3 border-[#2D5F4F] shadow-sm">
                            <p className="text-xs text-gray-700 line-clamp-2">
                              <strong className="text-[#2D5F4F]">Instructors:</strong>{" "}
                              {event.professors}
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(event)}
                        disabled={inCart || isFull || isRegistered}
                        className={`btn-register w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md ${
                          isRegistered
                            ? "bg-[#2D5F4F] text-white cursor-not-allowed opacity-70"
                            : inCart
                            ? "bg-[#2D5F4F] text-white cursor-default opacity-90"
                            : isFull
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-[#2D5F4F] text-white hover:bg-[#3A7B6B]"
                        }`}
                      >
                        {isRegistered ? (
                          <>
                            Registered <CheckCircle className="w-4 h-4" />
                          </>
                        ) : inCart ? (
                          <>
                            In Cart ✓ <CheckCircle className="w-4 h-4" />
                          </>
                        ) : isFull ? (
                          "Sold Out"
                        ) : (
                          <>
                            Add to Cart <ShoppingCart className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Overlay */}
          {cartOpen && (
            <div
              onClick={() => setCartOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 998,
                backdropFilter: "blur(4px)",
              }}
              className="cart-overlay"
            />
          )}

          {/* Sliding Cart Sidebar */}
          {cartOpen && (
            <div
              className="cart-sidebar"
              style={{
                position: "fixed",
                right: 0,
                top: 0,
                bottom: 0,
                width: "min(600px, 90vw)",
                backgroundColor: "white",
                zIndex: 999,
                boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Cart Header */}
              <div
                style={{
                  padding: "2rem",
                  borderBottom: "3px solid " + EOcolors.primary,
                  backgroundColor: "#f8faf9",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        backgroundColor: EOcolors.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShoppingCart style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: "1.75rem",
                          fontWeight: "900",
                          color: EOcolors.primary,
                          margin: 0,
                        }}
                      >
                        Your Cart
                      </h2>
                      <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: 0 }}>
                        {cart.length} {cart.length === 1 ? "event" : "events"} selected
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCartOpen(false)}
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      borderRadius: "0.5rem",
                      border: "2px solid " + EOcolors.primary,
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X style={{ width: "1.25rem", height: "1.25rem", color: EOcolors.primary }} />
                  </button>
                </div>
              </div>

              {/* Cart Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", paddingTop: "4rem" }}>
                    <ShoppingCart
                      style={{
                        width: "4rem",
                        height: "4rem",
                        color: "#D1D5DB",
                        margin: "0 auto 1rem",
                      }}
                    />
                    <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "#6B7280" }}>
                      Your cart is empty
                    </p>
                    <p style={{ fontSize: "0.875rem", color: "#9CA3AF", marginTop: "0.5rem" }}>
                      Add events to get started
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {cart.map((item) => (
                      <div
                        key={item._id}
                        className="cart-item"
                        style={{
                          display: "flex",
                          gap: "1rem",
                          padding: "1.25rem",
                          backgroundColor: "#f8faf9",
                          borderRadius: "1rem",
                          border: "2px solid #e5e7eb",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "700",
                              color: EOcolors.primary,
                              margin: "0 0 0.5rem 0",
                            }}
                          >
                            {item.displayName}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#6B7280",
                                backgroundColor: "white",
                                padding: "0.25rem 0.75rem",
                                borderRadius: "0.375rem",
                              }}
                            >
                              {item.type}
                            </span>
                            <span style={{ fontSize: "1.125rem", fontWeight: "900", color: EOcolors.primary }}>
                              ${(item.fee || 0).toFixed(2)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#9CA3AF",
                              marginTop: "0.5rem",
                              margin: "0.5rem 0 0 0",
                            }}
                          >
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item._id)}
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            backgroundColor: "#EF4444",
                            color: "white",
                            border: "none",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s",
                          }}
                        >
                          <Trash2 style={{ width: "1.125rem", height: "1.125rem" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer / Checkout */}
              {cart.length > 0 && (
                <div
                  style={{
                    padding: "1.5rem",
                    borderTop: "3px solid " + EOcolors.primary,
                    backgroundColor: "#f8faf9",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "1.25rem",
                      borderRadius: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "#374151" }}>Total</span>
                      <span style={{ fontSize: "2rem", fontWeight: "900", color: EOcolors.primary }}>
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.5rem", margin: "0.5rem 0 0 0" }}>
                      {cart.length} event{cart.length > 1 ? "s" : ""} in cart
                    </p>
                  </div>

                  <button
                    onClick={handleCheckout}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      backgroundColor: EOcolors.primary,
                      color: "white",
                      border: "none",
                      borderRadius: "0.75rem",
                      fontSize: "1.125rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      transition: "all 0.3s",
                    }}
                  >
                    {totalAmount > 0 ? (
                      <>
                        Proceed to Checkout <CreditCard style={{ width: "1.5rem", height: "1.5rem" }} />
                      </>
                    ) : (
                      <>
                        Register Free <CheckCircle style={{ width: "1.5rem", height: "1.5rem" }} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {paymentOpen && (
            <PaymentModal
              open={paymentOpen}
              onClose={() => setPaymentOpen(false)}
              eventName={`${cart.length} Event${cart.length > 1 ? "s" : ""}`}
              amount={totalAmount}
              onSuccess={handlePaymentSuccess}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </>
  );
}