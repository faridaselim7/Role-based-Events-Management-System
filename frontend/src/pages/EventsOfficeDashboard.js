import React, { useState, useEffect, useRef } from "react";
import {
  Store,
  MapPin,
  Dumbbell,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  BarChart3,
  FileText,
  Calendar,
  Search
} from "lucide-react";

import BoothSetupPoll from "../components/events-office/BoothSetupPoll";
import BazaarManagement from "../components/events-office/BazaarManagement";
import TripManagement from "../components/events-office/TripManagement";
import GymManagement from "../components/events-office/GymManagement";
import VendorRequests from "../components/events-office/VendorRequests";
import WorkshopManagement from "../components/events-office/WorkshopManagement";
import ConferenceManagement from "../components/events-office/ConferenceManagement";
import EventAttendanceReport from "../components/events-office/EventAttendanceReport";
import SalesReport from "../components/events-office/SalesReport";
import VendorPartners from "../components/VendorPartners";
import DocumentManagement from "../components/events-office/DocumentManagement";
import UnifiedDashboardLayout from "../components/UnifiedDashboardLayout";
import useNotifications from "../stores/notifications";
import EventsView from "./BrowseEvents";
import LostAndFoundManagement from "./LostAndFoundManagement";

import { FullPageLoader } from "../components/LoadingEmptyStates";
import { api } from "../lib/api"; // adjust path if your api file is in /lib

import useAllEventNotifications from "../hooks/useAllEventNotifications";
import { startTransition } from "react";

const EventsOfficeDashboard = React.memo(function EventsOfficeDashboard({
  user,
  onLogout,
}) {
  const [currentView, setCurrentView] = useState("events");
  const [createdPollId, setCreatedPollId] = useState(null);
  const [reportView, setReportView] = useState("attendance");
  const [initialLoading, setInitialLoading] = useState(true);
  const { addNotification } = useNotifications();
  const eventsRef = useRef(null);

  const currentUser = user || JSON.parse(localStorage.getItem("user"));

  
  useAllEventNotifications("eventsOffice");

  // Safe logout that ONLY fixes Events Office Dashboard
const handleSafeLogout = () => {
  startTransition(() => {
    // Clear everything synchronously
    localStorage.clear();
    // Fire-and-forget logout request (won't block React)
    api.post("/auth/logout").catch(() => {});
    // Call the parent's onLogout (this navigates away)
    onLogout();
  });
};

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 🔔 Load EO notifications from backend (workshop_submitted)
// EVENT OFFICE NOTIFICATIONS (Fixed)
// ========================================
useEffect(() => {
  const seenIds = new Set();

  const fetchEONotifications = async () => {
    try {
      const res = await api.get("/eo/notifications", {
        headers: {
          "x-role": "events_office",
        },
      });

      const list = res.data || [];

      list
        .filter((n) => n.type === "workshop_submitted")
        .forEach((n) => {
          if (seenIds.has(n._id)) return;
          seenIds.add(n._id);

          addNotification({
            id: n._id,
            type: "info", // Changed to info (blue) for workshop submissions
            message: n.message,
            read: false,
            temporary: false, // Persist in bell dropdown
            createdAt: n.createdAt,
            timestamp: n.createdAt,
          });
        });
    } catch (err) {
      console.error("Failed to load EO notifications", err);
    }
  };

  fetchEONotifications();
  const interval = setInterval(fetchEONotifications, 60 * 1000);
  return () => clearInterval(interval);
}, [addNotification]);

// ========================================
// NEW EVENTS NOTIFICATIONS (Fixed - No Duplicates)
// ========================================
useEffect(() => {
  const seenEventIds = new Set();

  const fetchNewEvents = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/notifications/new-events");
      const newEvents = await res.json();

      newEvents.forEach((event) => {
        const eventId = `event-${event.id}`;
        if (seenEventIds.has(eventId)) return; // Skip if already added
        seenEventIds.add(eventId);

        addNotification({
          id: eventId,
          type: "info", // Blue notifications
          message: `📢 New event added: "${event.title}" on ${event.date}`,
          read: false,
          temporary: false, // Persist in bell dropdown
          createdAt: new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error("Error fetching new event notifications", err);
    }
  };

  fetchNewEvents();
  const interval = setInterval(fetchNewEvents, 60 * 1000);
  return () => clearInterval(interval);
}, [addNotification]);

// ========================================
// EVENT REMINDERS (Already Good - No Changes Needed)
// ========================================
useEffect(() => {
  const fetchRegisteredEvents = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.id) return;

      const res = await fetch(`http://localhost:5001/api/registrations/user/${storedUser.id}`);
      const data = await res.json();
      const registeredEvents = data.events || [];

      const now = Date.now();

      registeredEvents.forEach((event) => {
        const eventTime = new Date(event.date).getTime();
        const oneDayBefore = eventTime - 24 * 60 * 60 * 1000;
        const oneHourBefore = eventTime - 60 * 60 * 1000;

        if (oneDayBefore > now) {
          setTimeout(() => {
            addNotification({
              id: `${event._id}-reminder-1d`,
              type: "info", // Blue notifications
              message: `⏰ Reminder: "${event.title}" starts in 1 day.`,
              read: false,
              temporary: false, // Persist in bell dropdown
              createdAt: new Date().toISOString(),
            });
          }, oneDayBefore - now);
        }

        if (oneHourBefore > now) {
          setTimeout(() => {
            addNotification({
              id: `${event._id}-reminder-1h`,
              type: "info", // Blue notifications
              message: `⏰ Reminder: "${event.title}" starts in 1 hour.`,
              read: false,
              temporary: false, // Persist in bell dropdown
              createdAt: new Date().toISOString(),
            });
          }, oneHourBefore - now);
        }
      });
    } catch (err) {
      console.error("Failed to fetch registered events:", err);
    }
  };

  fetchRegisteredEvents();
}, [addNotification]);

// ========================================
// PENDING VENDOR REQUESTS (Fixed - No Duplicates)
// ========================================
useEffect(() => {
  const seenVendorIds = new Set();

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/notifications/pending-vendors");
      const notifications = await res.json();

      notifications.forEach((notif) => {
        if (seenVendorIds.has(notif._id)) return; // Skip if already added
        seenVendorIds.add(notif._id);

        addNotification({
          id: notif._id,
          type: notif.type || "info", // Use info if type not specified
          message: notif.message,
          read: notif.read || false,
          temporary: false, // Persist in bell dropdown
          createdAt: notif.createdAt,
        });
      });
    } catch (err) {
      console.error("Error fetching vendor notifications:", err);
    }
  };

  fetchPendingRequests();
  const interval = setInterval(fetchPendingRequests, 60 * 1000);
  return () => clearInterval(interval);
}, [addNotification]);



  const navigation = [
     { name: "Browse Events", icon: <Calendar className="w-4 h-4" />, view: "events" },
    {
      name: "Bazaars",
      view: "bazaars",
      icon: <Store className="w-4 h-4" />,
      color: "#3B5C90",
    },
    {
      name: "Trips",
      view: "trips",
      icon: <MapPin className="w-4 h-4" />,
      color: "#1D3309",
    },
    {
      name: "Gym",
      view: "gym",
      icon: <Dumbbell className="w-4 h-4" />,
      color: "#816251",
    },
    {
      // same name as NEW, but icon from old dashboard
      name: "Workshops",
      view: "workshops",
      icon: <GraduationCap className="w-4 h-4" />,
      color: "#3B5C90",
    },
    {
      // Vendor Requests with ClipboardList icon from old dashboard
      name: "Vendor Requests",
      view: "vendorRequests",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      name: "Booth Polls",
      icon: <BarChart3 className="w-4 h-4" />,
      view: "boothPolls",
    },
    {
      name: "Conferences",
      view: "conferences",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      name: "Documents",
      view: "documents",
      icon: <FileText className="w-4 h-4" />,
      color: "#366B2B",
    },
    {
      name: "Reports",
      view: "reports",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      name: "Vendor Partners",
      view: "vendorPartners",
      icon: <Store className="w-4 h-4" />,
    },
    { name: "Lost & Found",
       icon: <Search className="w-4 h-4" />,
        view: "lostAndFound" }
  
   
  ];

  if (initialLoading) {
    return <FullPageLoader message="Loading Events Office Dashboard..." />;
  }

  return (
    <UnifiedDashboardLayout
      user={currentUser}
      onLogout={handleSafeLogout}
      navigation={navigation}
      currentView={currentView}
      onViewChange={setCurrentView}
      title="Events Office Dashboard"
    >
      {/* Browse Events View - Using new component */}
      {currentView === "events" && (
        <EventsView
          onSearchHandlerRef={eventsRef}
          userId={currentUser?.id}
        />
      )}

      {currentView === "bazaars" && <BazaarManagement />}

      {currentView === "trips" && <TripManagement />}
      {currentView === "gym" && <GymManagement />}
      {currentView === "workshops" && <WorkshopManagement />}
      {currentView === "vendorRequests" && <VendorRequests />}
      {currentView === "conferences" && <ConferenceManagement />}
      {currentView === "boothPolls" && (
        <BoothSetupPoll
          key={createdPollId || "create"}
          userRole={user.role}
          pollId={createdPollId}
          onPollCreated={(data) => setCreatedPollId(data.id)}
        />
      )}
      
{/* ==================== LOST & FOUND TAB ==================== */}
{currentView === "lostAndFound" && (
  <div className="space-y-8">
    <LostAndFoundManagement />
  </div>
)}

   {currentView === "reports" && (
  <div className="bg-white rounded-2xl shadow-lg p-8 border border-[#E2E8F0]">
    {/* Top toggle buttons – solid colors, no gradients */}
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => setReportView("attendance")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          reportView === "attendance"
            ? "bg-[#2B4B3E] text-white shadow-md border border-[#2B4B3E]"
            : "bg-white text-[#2B4B3E] hover:bg-[#F0F4FF] border border-[#D7DBF2]"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        Attendance Report
      </button>

      <button
        onClick={() => setReportView("sales")}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          reportView === "sales"
            ? "bg-[#2B4B3E] text-white shadow-md border border-[#2B4B3E]"
            : "bg-white text-[#2B4B3E] hover:bg-[#F0F4FF] border border-[#D7DBF2]"
        }`}
      >
        <FileText className="w-4 h-4" />
        Sales Report
      </button>
    </div>

    {reportView === "attendance" && <EventAttendanceReport />}
    {reportView === "sales" && <SalesReport />}
  </div>
)}


      {currentView === "vendorPartners" && (
  <div className="space-y-8">
    <VendorPartners layout="list" />   {/* Explicitly set layout="list" */}
  </div>
)}
      {currentView === "documents" && <DocumentManagement />}
    </UnifiedDashboardLayout>
  );
});

export default EventsOfficeDashboard;